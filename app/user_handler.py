import re
import bcrypt
# from app import login_handler
from app.db import get_db
from app.automaton import AnnotationAutomaton
import pickle
# from app import app
from flask import current_app as app
from app import error_handler
from flask_login import LoginManager,UserMixin,logout_user,login_user,login_required,current_user


SALT_ROUNDS = 12

class User(UserMixin):
    def __init__(self,uid,username,email,fname,lname,password,user_type,is_approved,annotated, automaton):
        """
        Params:
        uid : user id (unique userid for each user)
        username : user name (unique username used for login)
        email : email-id of the user
        fname: first (given) name
        lname: last(sur) name
        password: hashed user password
        user_type: 'admin' or 'normal' user
        is_approved : 'yes' or 'no' indicating if the user is approved to use the tool. (Change can only be done by admin user)
        annotated : list of id's of annotated comments
        """
        self.id = uid
        self.username = username
        self.email = email
        self.password = password
        self.fname = fname
        self.lname = lname
        self.user_type = user_type
        self.is_approved = is_approved
        self.annotated = annotated
        self.active = False
        self.automaton = (None if automaton is None else pickle.loads(automaton))
        self.admin = None
        if user_type == 'admin':
            self.admin='yes'

    def is_authenticated(self):
        #return true if user is authenticated, provided credentials
        return True

    def is_active(self):
        #return true if user is active and authenticated
        if self.is_approved == 'yes':
            self.active=True
            return True
        else:
            self.active=False
            return False

    def is_annonymous(self):
        return False
        #return true if annonymous, actual user return false (Currently Unused)

    def get_id(self):
        return str(self.id)
        #return id for user, and used to load user from user_loader callback

    def get_annotated(self):
        return ('' if self.annotated is None else self.annotated)
    
    def __repr__(self):
        return '<User %r, %r>' % (self.username, self.automaton)

    


def load_user_by_name(username):
    """
    Input params: username (unique username) for which the details of the user to be returned.
    returns: `user` object of type(Class) 'User' containing all the parameters if `username` exists in the database, `None` otherwise.
    """

    db = get_db()
    try:
        uid,username,email,fname,lname,password,user_type,is_approved,annotated = db.execute(
            'SELECT id,username,email,given_name,surname,password,user_type,is_approved,annotated FROM user WHERE username = ?', (username,)
            ).fetchone()
        user = User(uid,username,email,fname,lname,password,user_type,is_approved,annotated)
    except Exception as e:
        app.logger.error("Error occurred while loading the user {}".format(username))
        app.logger.error("Error occurred while loading the user error:".format(str(e)))
        user = None
    return user
def load_user(user_id):
    """
    Input params: userid (unique userid) for which the details of the user to be returned.
    returns: `user` object of type 'User' containing all the parameters if `userid` exists in the database, `None` otherwise.
    """
    app.logger.debug("load_user()")
    db = get_db()
    try:
        uid,username,email,fname,lname,password,user_type,is_approved,annotated,automaton = db.execute(
            'SELECT id,username,email,given_name,surname,password,user_type,is_approved,annotated,automaton FROM user WHERE id = ?', 
            (user_id,)).fetchone()
        user = User(uid,username,email,fname,lname,password,user_type,is_approved,annotated, automaton)
    except Exception as e:
        app.logger.error("Error occurred while loading the user {}".format(user_id))
        app.logger.error("Error occurred while loading the user error:".format(str(e)))
        user = None
    return user

def authenticate_login(username, password:str):
    """
    Function that accepts the username and password, verifies the match between username and password.
    Params:
    username:   Input, username of the user. type: str
    password:   Input, password (plain text) of the user. type: str
    returns:    2 params: `user` object(or None), "Failure message" (or None)
                `user` object of type(Class) `User` if the username exists and password matches None otherwise.
                Error message if error occurs
    """
    app.logger.debug("from authenticate_login")
    db = get_db()

    ## Check if usernae exists!
    if db.execute('SELECT id,username FROM user WHERE username = ?', (username,)).fetchone() is None:
        return None, "Username does not exist"

    ## Obtain the hashed password from DB
    row = db.execute('SELECT id,username,email,given_name,surname,password,user_type,is_approved,annotated,automaton FROM user WHERE username = ?', (username,)).fetchone()

    ## Check if the passwords match
    if not bcrypt.checkpw(password.encode(), row[5]):
        app.logger.debug("Password mismatch")
        return None,"Incorrect password"

    ## obtain the `user` object
    user = User(uid=row[0],username=row[1],email=row[2],fname=row[3],lname=row[4],password=row[5],user_type=row[6],is_approved=row[7],annotated=row[8], automaton=row[9])

    if user.is_active():
        app.logger.debug("User is active")
        if user.automaton is None:
            automaton = pickle.dumps(AnnotationAutomaton.setup())
            db.execute('UPDATE user SET automaton=? WHERE id=?',(automaton,user.id))
            db.commit()
        return user,None
    else:
        app.logger.debug("User is not active, returned None as user")
        return None, "You don't have an active account, please contact admin."

def register_user(username,email,fname,lname,password: str,confirm_password):
    """
    Function that creates a new user by adding an entry to the database.
    Params:
        username:   Input, username of the user. type: str
        email:      Input, email of the user. type: str
        fname:      Input, first-name of the user. type: str
        lname:      Input, last-name of the user. type: str
        password:   Input, password (plain text) of the user. type: str (Should be atleast 4 chars)
        confirm_password:   Input, confirm password (plain text) of the user. type: str

    returns: 2 params:    "Success message"(or None), "Failure message"(or None)
    """
    app.logger.debug("from register_user()")
    error_message = ""

    ## Handle length of the password and check of confirmation password is same as the original
    if len(username)<4:
        error_message = "Username must be atleast 4 characters long!"
    if len(password)<4:
        error_message = "Password must be atleast 4 characters long!"
    if password!=confirm_password:
        error_message = "The entered password is not same as the confirmation password!"

    ## Check if the email address is valid (Basic regex handler is used. It must have the format abc@xyz.lm[.pq])
    email_regex = r'[^@]+@[^@]+\.[^@]+'
    if not re.match(email_regex,email):
        app.logger.debug("email id entered did not match regex: {}".format(email_regex))
        error_message += " Enter valid email address!"

    if error_message != "":
        app.logger.debug("Error: {}".format(error_message))
        return None, error_message

    db = get_db()

    ## return error if the username already exists
    if db.execute('SELECT id,username FROM user WHERE username = ?', (username,)).fetchone():
        app.logger.debug("Username {} already present in the database, did not add new user".format(username))
        return None, "username already exists!"

    ## hash the password before storing
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(SALT_ROUNDS))

    try:
        ## Insert the data into the database
        db.execute('INSERT INTO user (username, email, given_name, surname, password, user_type, is_approved, annotated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        (username, email, fname, lname, password_hash,"normal","no", ""))
        db.commit()
        app.logger.debug("New user added to db, db-commit successful")
        return "Successfully added user", None
    except Exception as e:
        app.logger.error("Exception occurred : {}".format(str(e)))
        app.logger.error("rolling back DB")
        db.rollback()
        app.logger.error("Error occurred while adding user, DB rolled-back")
        raise error_handler.DatabaseError(str(e))


def change_password(username,password: str,confirm_password,new_password: str,confirm_new_password):
    """
    Function that changes the user login password. Databse is updated upon password change.
    Params:
                    username:   Input, username of the user. type: str
                    password:   Input, password (plain text) of the user. type: str (Should be atleast 4 chars)
            confirm_password:   Input, confirm password (plain text) of the user. type: str
                new_password:   Input, new password (plain text) of the user. type: str (Should be atleast 4 chars)
        confirm_new_password:   Input, confirm new password (plain text) of the user. type: str

    returns: 2 params:    "Success message"(or None), "Failure message"(or None)
    """
    app.logger.debug("from change_password()")
    error_message = ""

    ## Check if the original password and confirm_password are same
    if password!=confirm_password:
        error_message +=" The entered current password is not same as the confirmation password!"
    
    ## Check if the new_password is atleast 4 characters long
    if len(new_password)<4:
        error_message += " New password must be atleast 4 characters long!"

    ## Check if the new_password and the confirmation of new password (confirm_new_password) are same
    if new_password!=confirm_new_password:
        error_message += " The entered new password is not same as the confirmation password!"

    db = get_db()
    row = db.execute('SELECT password FROM user WHERE username = ?', (username,)).fetchone()

    if not bcrypt.checkpw(password.encode(), row[0]):
        error_message = "Incorrect Current Password!"

    if error_message != "":
        ## Return Failure
        return None, error_message

    new_password_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt(SALT_ROUNDS))


    try:
        db.execute('UPDATE user SET password=? WHERE username=?',(new_password_hash,username))
        db.commit()
        return "Successfully changed the password",None

    except Exception as e:
        app.logger.error("Exception occurred : {}".format(str(e)))
        app.logger.error("rolling back DB")
        db.rollback()
        app.logger.error("Error occurred while adding user, DB rolled-back")
        raise error_handler.DatabaseError(str(e))


def activate_user(username):
    """
    Function that activates 'inactive' user.
    Params:
        username:   Input, username of the user. type: str
    returns: 2 params:    "Success message"(or None), "Failure message"(or None)
    """
    app.logger.debug("from activate_user()")
    db = get_db()
    try:
        db.execute('UPDATE user SET is_approved=? WHERE username=?',("yes",username))
        db.commit()
        return "Successfully activated the user "+username, None

    except Exception as e:
        app.logger.error("Exception occurred : {}".format(str(e)))
        app.logger.error("rolling back DB")
        db.rollback()
        app.logger.error("Error occurred while adding user, DB rolled-back")
        raise error_handler.DatabaseError(str(e))

def deactivate_user(username):
    """
    Function that deactivates 'active' user.
    Params:
        username:   Input, username of the user. type: str
    returns: 2 params:    "Success message"(or None), "Failure message"(or None)
    """
    app.logger.debug("from deactivate_user()")
    db = get_db()
    try:
        db.execute('UPDATE user SET is_approved=? WHERE username=?',("no",username))
        db.commit()
        return "Successfully deactivated the user "+username,None

    except Exception as e:
        app.logger.error("Exception occurred : {}".format(str(e)))
        app.logger.error("rolling back DB")
        db.rollback()
        app.logger.error("Error occurred while adding user, DB rolled-back")
        raise error_handler.DatabaseError(str(e))

def change_password_admin(username,password: str,confirm_password,admin_username,admin_password: str):
    """
    Function that changes the user login password through an admin user. Databse is updated upon password change.
    Params:
                    username:   Input, username of the user whose password is desired to be changed. type: str
                    password:   Input, password (plain text) for the username. type: str (Should be atleast 4 chars)
            confirm_password:   Input, confirm password (plain text) for the username. type: str
              admin_username:   Input, username of the admin whose is changeing the password fot the user. type: str
              admin_password:   Input, password (plain text) for the admin_username. type: str (Should be atleast 4 chars)


    returns: 2 params:    "Success message"(or None), "Failure message"(or None)
    """
    app.logger.debug("from change_password_admin()")
    db = get_db()
    error_message = ""
    if password != confirm_password:
        error_message += " password and confirmation password are not the same"
    if len(password)<4:
        error_message += " New password must be atleast 4 characters long!"

    ## Authenticate admin password
    row = db.execute('SELECT password FROM user WHERE username = ?', (admin_username,)).fetchone()

    if not bcrypt.checkpw(admin_password.encode(), row[0]):
        error_message += " Incorrect Password"

    if error_message != "":
        return None, error_message
    
    new_password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(SALT_ROUNDS))

    try:
        db.execute('UPDATE user SET password=? WHERE username=?',(new_password_hash,username))
        db.commit()
        return "Successfully changed password for user "+username,None

    except Exception as e:
        app.logger.error("Exception occurred : {}".format(str(e)))
        app.logger.error("rolling back DB")
        db.rollback()
        app.logger.error("Error occurred while adding user, DB rolled-back")
        raise error_handler.DatabaseError(str(e))

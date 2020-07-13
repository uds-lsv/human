from flask_login import LoginManager,UserMixin,logout_user,login_user,login_required,current_user
from flask import Flask
from app.db import get_db
## Custom import
from app import login_manager
from app import app
from app import error_handler
class User(UserMixin):
    def __init__(self,uid,username,email,fname,lname,password,user_type,is_approved,annotated):
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
        return '<User %r>' % (self.username)

    
@login_manager.user_loader
def load_user(user_id):
    """
    Input params: userid (unique userid) for which the details of the user to be returned.
    returns: `user` object of type 'User' containing all the parameters if `userid` exists in the database, `None` otherwise.
    """
    app.logger.debug("from load_user()")
    db = get_db()
    try:
        uid,username,email,fname,lname,password,user_type,is_approved,annotated = db.execute(
            'SELECT id,username,email,given_name,surname,password,user_type,is_approved,annotated FROM user WHERE id = ?', 
            (user_id,)).fetchone()
        user = User(uid,username,email,fname,lname,password,user_type,is_approved,annotated)
    except Exception as e:
        app.logger.error("Error occurred while loading the user {}".format(user_id))
        app.logger.error("Error occurred while loading the user error:".format(str(e)))
        user = None
    return user

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

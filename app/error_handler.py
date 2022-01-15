from flask import render_template
# from app import app
# from flask import current_app as app

from flask_login import current_user

class DatabaseError(Exception):
    status_code = 500
    def __init__(self, message, status_code=None, payload=None):
        super().__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
            self.payload = payload

class UnknownError(Exception):
    status_code = 501
    def __init__(self, message, status_code=None, payload=None):
        super().__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
            self.payload = payload

class AutomatonError(Exception):
    status_code = 500
    def __init__(self, message, status_code=None, payload=None):
        super().__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
            self.payload = payload

def handle_automaton_error(self):
    error_title = "Database Error Occurred."
    error_message = self.message
    error_info = None
    try:
        return render_template('error.html', error_title = error_title, error_message = error_message, error_info = error_info, user=current_user.username)
    except:
        return render_template('error.html', error_title = error_title, error_message = error_message, error_info = error_info)



# @app.errorhandler(UnknownError)
def handle_unknown_error(self):
    error_title = "Unknown Error Occurred."
    error_message = self.message
    error_info = None
    try:
        return render_template('error.html', error_title = error_title, error_message = error_message, error_info = error_info, user=current_user.username)
    except:
        return render_template('error.html', error_title = error_title, error_message = error_message, error_info = error_info)

                                                                                       
# @app.errorhandler(DatabaseError)
def handle_database_error(self):
    error_title = "Database error occurred."
    error_message = self.message
    error_info = None
    try:
        return render_template('error.html', error_title = error_title, error_message = error_message, error_info = error_info, user=current_user.username)
    except:
        return render_template('error.html', error_title = error_title, error_message = error_message, error_info = error_info)

## Error 404 page not found
# @app.errorhandler(404)
def page_not_found(internal_error):
    error_title = "Page not found Error."
    error_message = "The page you are trying to access cannot not be found or does not exist."
    error_info = "Please verify if the entered URL is correct."
    try:
        return render_template('error.html', error_title = error_title, error_message = error_message, error_info = error_info, user=current_user.username)
    except:
        return render_template('error.html', error_title = error_title, error_message = error_message, error_info = error_info)
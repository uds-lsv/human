from flask import Flask
from setuptools import setup
from app.db import get_db, init_app
from flask_login import LoginManager
import os
import logging
from flask.logging import create_logger
from flask_cors import CORS
from app.user_handler import User, load_user
from app.error_handler import handle_database_error,  handle_unknown_error, UnknownError, DatabaseError, page_not_found


def create_app(test_config=None, debug=True):
    print('went into __init__')
    app = Flask(__name__)
    CORS(app)
    app.config.from_mapping(
        SECRET_KEY='dev',
        DATABASE=os.path.join(app.instance_path, 'database.sqlite'),
        DEBUG=debug,
        TESTING=debug
    )
    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile("config.py", silent=True)
    else:
        # load the test config if passed in
        app.config.update(test_config)

    print(app.debug)
    init_app(app)

    login_manager = LoginManager(app)
    login_manager.init_app(app)
    login_manager.login_view = 'routes.login'

    login_manager.user_loader(load_user)
    # logger
    # when running via flask run:
    # logging.basicConfig(level=logging.DEBUG)

    # app.logger = create_logger(app)
    # when running gunicorn
    gunicorn_logger = logging.getLogger('gunicorn.error')
    app.logger.handlers.extend(gunicorn_logger.handlers)
    app.logger = gunicorn_logger
    # transitions logger
    logging.getLogger('transitions').setLevel(logging.ERROR)

    from app import routes
    app.register_blueprint(routes.app)

    app.register_error_handler(DatabaseError, handle_database_error)
    app.register_error_handler(UnknownError, handle_unknown_error)
    app.register_error_handler(404, page_not_found)

    return app

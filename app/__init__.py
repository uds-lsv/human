from flask import Flask
from app.db import get_db, init_app
from flask_login import LoginManager
import os
import logging
from flask_cors import CORS
from app.user_handler import load_user
from app.error_handler import AutomatonError, handle_automaton_error, handle_database_error,  handle_unknown_error, UnknownError, DatabaseError, page_not_found


def create_app(test_config=None, debug=True):
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
        app.config.from_pyfile(os.path.join(app.root_path, "../config.py"), silent=False)
    else:
        # load the test config if passed in
        app.config.update(test_config)

    init_app(app)

    login_manager = LoginManager(app)
    login_manager.init_app(app)
    login_manager.login_view = 'routes.login'

    login_manager.user_loader(load_user)
    # logger
    # when running via flask run:
    if debug:
        logging.basicConfig(level=logging.DEBUG)

    # when running gunicorn
    gunicorn_logger = logging.getLogger('gunicorn.error')
    app.logger.handlers.extend(gunicorn_logger.handlers)
    app.logger = gunicorn_logger
    # transitions logger
    logging.getLogger('transitions').setLevel(logging.ERROR)

    from app import routes
    app.register_blueprint(routes.app)

    if not debug:
        app.register_error_handler(DatabaseError, handle_database_error)
        app.register_error_handler(UnknownError, handle_unknown_error)
        app.register_error_handler(AutomatonError, handle_automaton_error)
        app.register_error_handler(404, page_not_found)

    if debug:
        @app.shell_context_processor
        def imports():
            return {"db": get_db()}
    return app

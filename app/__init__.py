from flask import Flask
from flask_bootstrap import Bootstrap
from app.db import get_db, init_app
from flask_login import LoginManager
import os
import logging
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.DEBUG)
app.config.from_mapping(
    SECRET_KEY='dev',
    DATABASE=os.path.join(app.instance_path, 'database.sqlite'),
)
init_app(app)

login_manager = LoginManager(app)
login_manager.init_app(app)
login_manager.login_view = 'login'

from app import routes

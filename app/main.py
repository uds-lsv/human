from flask import Flask
from flask import session
from flask_socketio import SocketIO, emit
from flask.ext.login import current_user, logout_user

def create_app():
    return Flask(__name__)


app = create_app()
app.config['SECRET_KEY']='secret_session'
socketio = SocketIO(app)

@socketio.on('connect')
def create_session():
    session['SECRET_KEY']='secret_session'

@socketio.on('disconnect')
def disconnect_user():
    session.pop('secret_session', None)


if __name__ == '__main__':
    app.run(debug=True)

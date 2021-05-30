import sqlite3

import os
import click
from flask import current_app, g
from flask.cli import with_appcontext

import pandas as pd
import hashlib
from getpass import getpass

def get_db():
    """Connect to the application's configured database. The connection
    is unique for each request and will be reused if this is called
    again.
    """
    if 'db' not in g:
        g.db = sqlite3.connect(
            current_app.config['DATABASE'],
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row

    return g.db


def close_db(e=None):
    """If this request connected to the database, close the
    connection.
    """
    db = g.pop('db', None)

    if db is not None:
        db.close()


def init_db():
    """Clear existing data and create new tables."""
    db = get_db()

    with current_app.open_resource('schema.sql') as f:
        db.executescript(f.read().decode('utf8'))


def save_db(table):
    db = get_db()
    if table=="all":
        tables = db.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()
    else:
        tables = [[table]]
    for table in tables:
        df = pd.read_sql_query("SELECT * FROM "+ table[0], db)
        click.echo(df)
        if os.path.isfile('output/' + table[0]+'.csv'):
            os.rename('output/' + table[0]+'.csv', 'output/' + table[0]+'.bak')
        df.to_csv('output/' + table[0]+'.csv', index_label='index', sep=";")

@click.command('save-db')
@click.argument('table')
@with_appcontext
def save_db_command(table):
    """Save table to csv file."""
    save_db(table)

@click.command('init-db')
@with_appcontext
def init_db_command():
    """Create new database from schema.sql after backing up existing data."""
    if not os.path.isfile(current_app.config['DATABASE']):
        init_db()
    else:
        while True:
            create = input('Do you REALLY want to re-initialize existing db? y/n: ')
            if create == 'no' or create == 'n':
                return
            elif create == 'yes' or create == 'y':
                break
        save_db('all')
        init_db()
    click.echo('Initialized the database.')

@click.command('db-from-csv')
@click.argument('csv')
@click.argument('table')
@with_appcontext
def db_from_csv_command(csv, table):
    db = get_db()
    df = pd.read_csv(csv, sep=';')
    if table == 'user':
        del df['index']
    df.to_sql(table, db, if_exists='replace', index=False)

@click.command('add-admin')
@with_appcontext
def add_admin():
    """
    Function that shows prompt for user to add an Admin user to the database.
    """
    db = get_db()
    db_cursor = db.cursor()
    while True:
        create = input('Create Admin user? y/n: ')
        if create == 'no' or create == 'n':
            return
        elif create == 'yes' or create == 'y':
            break
    username = input('Username: ')
    email = input('Email: ')
    given_name = input('Given name: ')
    surname = input('Surname: ')
    user_type = 'admin'
    is_approved = 'yes'
    annotated = ''
    password = 0
    password = getpass()
    password_hash_object = hashlib.sha256(password.encode('utf-8'))
    password_hash = password_hash_object.hexdigest()
    db_cursor.execute("INSERT INTO user (username, email, given_name, surname, password, user_type, is_approved, annotated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    (username, email, given_name, surname, password_hash, user_type, is_approved, annotated))
    db.commit()
    db.close()
    click.echo("Successfully added Administrator account.")

@click.command('remove-annotation')
@click.option('-id', '--id')
@click.option('-dataid', '--data_id')
@with_appcontext
def remove_annotation(id, data_id):
    db = get_db()
    db_cursor = db.cursor()
    if id:
        pass
        # annotation = db_cursor.execute("SELECT * FROM annotations WHERE id=?",
        #     (id,))
        # db_cursor.execute("DELETE FROM annotations WHERE id=?",
        #     (id,))
    elif data_id:

        data = db_cursor.execute("SELECT * from data WHERE id=?", (data_id,)).fetchone()
        # click.echo(data)

        # click.echo(data['id'])
        annotated = data['annotation_count']
        if annotated <= 0:
            return
        annotated = 0
        db_cursor.execute("UPDATE data SET annotation_count=? WHERE id=?",
            (annotated, data_id))
        db_cursor.execute("DELETE FROM annotations WHERE data_id=?",
            (data_id,))
        # click.echo(annotated)

    else:
        click.echo("Specify -id or -dataid to be removed.")

    # db_cursor.execute("INSERT INTO user (username, email, given_name, surname, password, user_type, is_approved, annotated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    # (username, email, given_name, surname, password_hash, user_type, is_approved, annotated))


    db.commit()
    db.close()
    click.echo("Successfully removed.")


def init_app(app):
    """Register database functions with the Flask app. This is called by
    the application factory.
    """
    app.teardown_appcontext(close_db)
    app.cli.add_command(init_db_command)
    app.cli.add_command(save_db_command)
    app.cli.add_command(db_from_csv_command)
    app.cli.add_command(add_admin)  
    app.cli.add_command(remove_annotation)  

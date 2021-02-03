import json
import logging
import sys
import os


# Templates for each state type
BASE_TEMPLATE = """
'{idx}': {{
    on: {{{transitions}
    }},
    entry: ['showUI'],
    meta: {{
        type: '{type}',
        question: '{question}',
    }}
}},
"""

LOADING_TEMPLATE = """
'{idx}': {{
    invoke: {{
        id: 'getData',
        src: (_, event) =>
            Service.get('/api/getdata').then((res) => {{
                Data.reset()
                Data.data = res
                Data.annotations['id'] = Data.data.id
                console.log(res)
            }}),
        {transitions}
    }},
    meta: {{
        type: 'loading',
    }},
}},
"""

LOADING_FILE_TEMPLATE = """
{idx}: {{
    invoke: {{
        id: 'start',
        src: (_, event) =>
            new Promise((resolve, reject) => {{
                Data.reset()
                Service.fetch('/api/getdatafile')
                    .then(async (response) => {{
                        const contentType = response.headers.get(
                            'content-type'
                        )
                        if (
                            contentType &&
                            contentType.indexOf('text/html') !== -1
                        ) {{
                            response.text().then((text) => {{
                                reject(text)
                            }})
                        }} else if (
                            contentType &&
                            contentType.indexOf(
                                'multipart/form-data'
                            ) !== -1
                        ) {{
                            return response.formData()
                        }}
                    }})
                    .then((fd) => {{
                        const file = fd.get('file') as File
                        Data.data = JSON.parse(fd.get('data').toString())
                        Data.annotations['id'] = Data.data.id
                        file.arrayBuffer().then(async (buffer) => {{
                            const blob = new Blob([ buffer ], {{
                                type: 'octet/stream',
                            }})
                            const url = await blobToDataURL(blob)
                            if (file.name.endsWith('.pdf')) {{
                                Data.pdf = url
                                resolve({{ bboxes: [] }})
                            }} else if (
                                file.name.endsWith('.jpg') ||
                                file.name.endsWith('.jpeg') ||
                                file.name.endsWith('.png')
                            ) {{
                                Data.picture = url
                                resolve({{ bboxes: [] }})
                            }} else {{
                                throw Error(
                                    'Wrong file ending: ' +
                                        file.name +
                                        'Has to be one of pdf, jpg, jpeg, png'
                                )
                            }}
                        }})
                    }})
                    .catch((e) => {{
                        return e
                    }})
            }}),
        {transitions}
    }},
    meta: {{
        type: 'loadingfile',
    }},
}},

"""

BOOLEAN_LABEL_TEMPLATE = """
'{idx}': {{
    on: {{{transitions}
    }},
    entry: ['showUI'],
    meta: {{
        type: '{type}',
        question: '{question}',
        column: '{column}'
    }}
}},
"""

SELECT_TEMPLATE = """
'{idx}': {{
    on: {{{transitions}
    }},
    entry: ['showUI'],
    meta: {{
        type: '{type}',
        question: '{question}',
        options: {options},
        column: '{column}'
    }}
}},
"""
CHOOSE_PAGE_TEMPLATE = """
'{idx}': {{
    on: {{
        NEXT: {{
            target: 'show_{idx}',
        }},
    }},
    entry: [ 'print', 'showUI', 'choosePage' ],
    meta: {{
        question: '{question}',
        type: '{type}',
    }},
}},
'show_{idx}': {{
    invoke: {{
        id: 'showPicChoose',
        src: (_, event) =>
            new Promise((resolve, reject) => {{
                event.data.then((blob: Blob) => {{
                    blobToDataURL(blob)
                        .then((src: string) => {{
                            Data.picture = src
                            return src
                        }})
                        .then((data) => {{
                            resolve(data)
                        }})
                }})
            }}),
        {transitions}
    }},
}},

"""

BBOX_TEMPLATE = """
{idx}: {{
    invoke: {{
        id: '{idx}',
        src: (_, event) =>
            new Promise((resolve, reject) => {{
                const payload = {{
                    image: Data.picture,
                    bboxes: event.data.bboxes
                    ? event.data.bboxes
                    : [],
                    api_call: '{api_call}',
                }}
                Service.post(
                    '/api/callAPI',
                    'json',
                    JSON.stringify(payload)
                ).then((res) => {{
                    Data.picture = res['image']
                    resolve(res)
                }})
            }}),
        onDone: {{
            target: 'show_{idx}',
            actions: [ 'print' ],
        }},
        onError: {{
            target: 'failure',
            actions: [ 'print', 'showError' ],
        }},
    }},
}},
'show_{idx}': {{
    on: {{{transitions}
    }},
    entry: [ 'showUI', 'showPictureLabeling' ],
    exit: [ 'saveBboxes' ],
    meta: {{
        question: '{question}',
        answer: 'Submit',
        type: 'labelPicture',
        column: '{column}',
    }},
}},
"""
BBOX_LABEL_TEMPLATE = """
{idx}: {{
    invoke: {{
        id: '{idx}',
        src: (_, event) =>
            new Promise((resolve, reject) => {{
                const payload = {{
                    image: Data.picture,
                    bboxes: event.data.bboxes
                    ? event.data.bboxes
                    : [],
                    api_call: '{api_call}',
                }}
                Service.post(
                    '/api/callAPI',
                    'json',
                    JSON.stringify(payload)
                ).then((res) => {{
                    Data.picture = res['image']
                    resolve(res)
                }})
            }}),
        onDone: {{
            target: 'show_{idx}',
            actions: [ 'print' ],
        }},
        onError: {{
            target: 'failure',
            actions: [ 'print', 'showError' ],
        }},
    }},
}},
'show_{idx}': {{
    on: {{{transitions}
    }},
    entry: [ 'showUI', 'chooseWords' ],
    exit: [ 'saveBboxes' ],
    meta: {{
        question: '{question}',
        answer: 'Submit',
        type: 'labelWords',
        column: '{column}',
    }},
}},
"""

FAILURE_TEMPLATE = """
failure: {
    invoke: {
        id: 'failure',
        src: (_, event) => () => {
            console.log(_)
            console.log(event)
            alert(event.data)
            return
        },
        onDone: {
            target: 'start',
            actions: [ 'print' ],
        },
        onError: {
            target: 'failure',
            actions: [ 'print' ],
        },
    },
},
"""

NOTHING_LEFT_TEMPLATE = """
nothingleft: {
    invoke: {
        id: 'nothingleft',
        src: (_, event) => () => {
            alert('No data left to annotate.')
        },
    },
},
"""

END_TEMPLATE = """
end: {
    invoke: {
        id: 'sendData',
        src: (_, event) =>
            Service.post(
                '/api/write_to_db',
                'json',
                JSON.stringify(Data.annotations)
            )
                .done((res) => {
                    console.log(res)
                })
                .fail((err) => {
                    console.log(err.responseJSON)
                }),
        onDone: {
            target: 'start',
            actions: [ 'print' ],
        },
        onError: {
            target: 'failure',
            actions: [ 'print' ],
        },
    },
    meta: {
        type: 'loading',
    },
}
}
}
"""


TRANSITION = """
        {}: {{
            target: '{}',
            {}
            }}"""

class AP_Parser():
    """
    Takes an AP json file and handles conversion to XState syntax
    as well as error handling during conversion.
    """
    def __init__(self):
        self.head = open('dsa_head.txt', 'r', encoding='utf8').read()
        #self.tail = open('static/dsa_tail.txt', 'r', encoding='utf8').read()
        self.templates = {'loading': LOADING_TEMPLATE,
                          'loadingFile': LOADING_FILE_TEMPLATE,
                          'read': BASE_TEMPLATE,
                          'boolean': BOOLEAN_LABEL_TEMPLATE,
                          'select': SELECT_TEMPLATE,
                          'checkmark': SELECT_TEMPLATE,
                          'label': BOOLEAN_LABEL_TEMPLATE,
                          'choosePage': CHOOSE_PAGE_TEMPLATE,
                          'bbox': BBOX_TEMPLATE,
                          'bboxLabel': BBOX_LABEL_TEMPLATE}
        self.columns = []

   
    def get_column(self, question):
        """Disambiguates database column information"""
        idx = question['idx']
        if idx == 'start':
            return question
        if 'column' not in question:
            question['column'] = idx
        self.columns.append(question['column'])
        return question

    def format_actions(self, actions):
        if len(actions) == 0:
            return ''
        actions = ["'{}'".format(a) for a in actions]
        return 'actions: [ {} ]'.format(','.join(actions))

    def get_transitions(self, question):
        """Disambiguate transitions"""
        typ = question['type']
        if 'saveAll' in question:
            saveAll = question['saveAll']
        else:
            saveAll = False
        transitions = []

        # Add transitions
        for tr in question['transitions']:
            # option is often referred to as path in the documentation
            option = tr[0]

            # Get next state
            if len(tr) > 1:
                if type(tr[1]) != list:
                    state = tr[1]
                else:
                    state = question['nextState']
            else:
                state = question['nextState']

            # Check actions
            if len(tr) > 1 or saveAll:
                actions = tr[-1] if type(tr[-1]) == list else []
                if saveAll:
                    actions.append('save')
                # bbox does not need save action
                if typ in ['bbox', 'bboxLabel'] and 'save' in actions:
                    actions.remove('save')
                actions = self.format_actions(actions)
            else: actions = ''

            transitions.append(TRANSITION.format(option, state, actions))

        # Add default transitions
        if typ == 'read':
            transitions.append(TRANSITION.format('NOTHINGLEFT', 'nothingleft', ''))
        if typ in ['loading', 'loadingFile', 'choosePage']:
            transitions.append(TRANSITION.format('onError', 'failure',
                                                 self.format_actions(['showError'])))

        return ','.join(transitions)
   
    def reformat(self, idx, question):
        """Reformat transitions and formats and parse into XState syntax"""
        question['idx'] = idx
        typ = question['type']
        question['transitions'] = self.get_transitions(question)
        question = self.get_column(question)
        return self.templates[typ].format(**question)

    def check_fields(self, question, unacceptable, necessary, typ, idx, error):
        """Throw error if an unecessary field in state exists or if
        a necessary field is missing."""
        # Check if unacceptable field in question
        if any(u in question for u in unacceptable):
            unacceptable = ['"{}"'.format(x) for x in unacceptable]
            logging.error("Question \"{}\": Question type \"{}\" does not take any of {}".format(idx, typ, ', '.join(unacceptable)))
            return True
        # Check if necessary field lacking in question
        if any(n not in question for n in necessary):
            necessary = ['"{}"'.format(x) for x in necessary]
            logging.error("Question \"{}\": Question type \"{}\" requires {}".format(idx,
                                                                                       typ,
                                                                                       ', '.join(necessary)))
        return error

    def check_ap(self, ap):
        """Go through AP before parsing and throw early errors if AP syntax incorrect."""
        # Must include start state
        error = False
        if 'start' not in ap:
            logging.error("Annotation protocol needs 'start' state.")
            error = True

        for idx, question in ap.items():
            # Check if type and transition exists (for all)
            if 'type' not in question:
                logging.error("Question \"{}\": Missing \"type\".".format(idx))
                error = True
            if 'transitions' not in question:
                logging.error("Question \"{}\": Missing \"tansitions\".".format(idx))
                error = True
            
            # Check if defined type
            typ = question['type']
            defined_types = ['loading', 'loadingFile', 'read', 'boolean', 'select',
                             'checkmark','label', 'choosePage', 'bbox', 'bboxLabel']
            if typ not in defined_types:
                logging.error("Question \"{}\": Type \"{}\" not defined. Choose from {}".format(idx, typ, ', '.join(defined_types)))
                error = True
            
            else:
                # Check necessary fields for each question type
                if typ in ['loading', 'loadingFile']:
                    if idx != 'start':
                        logging.info("Question \"{}\": Are you sure you want to load new data in state that is not 'start'?".format(idx))
                    unacceptable = ['question', 'options', 'column', 'saveAll']
                    necessary = []

                if typ == 'read':
                    unacceptable = ['options', 'column', 'saveAll', 'api_call']
                    necessary = ['question']
                if typ in ['boolean', 'label', 'choosePage']:
                    unacceptable = ['options', 'api_call']
                    necessary = ['question']
                if typ == 'checkmark' or typ == 'select':
                    unacceptable = ['api_call']
                    necessary = ['question', 'options']
                if typ in ['bbox', 'bboxLabel']:
                    unacceptable = ['options']
                    necessary = ['api_call', 'question']
                error = self.check_fields(question, unacceptable, necessary, typ, idx, error)

            # Check transition formatting
            transitions = question['transitions']
            # Must have at least one transition defined
            if len(transitions) == 0:
                logging.error('Question \"{}\": Empty transitions.'.format(idx))
                error = True
            # Check transition paths are defined
            for transition in transitions:
                path = transition[0]
                if typ in ['loading', 'loadingFile', 'choosePage'] and path != 'onDone':
                    logging.error('Question \"{}\": Question type \"loading\" only accepts transition path \"onDone\".'.format(idx))
                    error = True
                if typ in ['read', 'checkmark', 'label', 'bbox', 'bboxLabel'] and path != 'NEXT':
                    logging.error('Question \"{}\": Question type \"{}\" only accepts transition path \"NEXT\".'.format(idx, typ))
                    error = True
                if typ == 'boolean' and path not in ['YES', 'NO']:
                    logging.error('Question \"{}\": Question type \"{}\" only accepts transition paths \"YES\", \"NO\".'.format(idx, typ))
                    error = True
                if typ == 'select':
                    options = question['options']
                    if path not in options:
                        logging.error('Question \"{}\": Path \"{}\" not in options {}.'.format(idx, path, options))
                        error = True
            if typ == 'boolean':
                paths = [t[0] for t in transitions]
                if 'YES' not in paths:
                    logging.error('Question \"{}\": \"YES\" missing in question type \"boolean\".'.format(idx))
                    error = True
                if 'NO' not in paths:
                    logging.error('Question \"{}\": \"NO\" missing in question type \"boolean\".'.format(idx))
                    error = True

            # Check transition targets are defined
            nextState = True if 'nextState' in question else False
            target = None
            for transition in transitions:
                # Target must be defined either individually or in nextState
                if len(transition) == 1:
                    # Must have nextState if target not defined directly
                    if nextState == False:
                        logging.error('Question \"{}\": Transition {} has no defined target. Either set individual target or nextState option.'.format(idx, transition))
                        error = True
                    else:
                        target == question['nextState']
                if len(transition) > 1:
                    if type(transition[1]) == list:
                        if nextState == False:
                            logging.error('Question \"{}\": Transition {} has no defined target. Either set individual target or nextState option.'.format(idx, transition))
                            error = True
                        else:
                            target = question['nextState']
                    else:
                        target = transition[1]
                # Check if transition target exists
                if target not in [None, 'end'] and target not in ap:
                    logging.error('Question \"{}\": Transition target \"{}\" does not exist.'.format(idx, target))
                    error = True

            # Options should have defined transitions
            if typ == 'select':
                options = question['options']
                paths = [t[0] for t in transitions]
                for option in options:
                    if option not in paths:
                        logging.error('Question \"{}\": Option \"{}\" has no defined transition'.format(idx, option))
                        error = True

            # bbox does not need save action (saves by default)
            if typ in ['bbox', 'bboxLabel'] and type(transition[-1]) == list:
                if 'save' in transition[-1]:
                    logging.info('Question \"{}\": Question type \"{}\" does not require \"save\" action. Saving is performed by default here.'.format(idx, typ))
            # Inform about non-saving questions
            if typ not in ['loading', 'loadingFile', 'read', 'choosePage']:
                if 'saveAll' not in question:
                    for transition in transitions:
                        if type(transition[-1]) == list:
                            if 'save' not in transition[-1]:
                                logging.info('Question \"{}\": No saving action for {}. Are you sure?'.format(idx, transition))
                        else:
                            logging.info('Question \"{}\": No saving action for {}. Are you sure?'.format(idx, transition))
        
        if error == True:
            logging.error("===========================================================")
            logging.error("Errors occured while parsing the protocol. Please fix and try again. Aborting...")
            sys.exit(1)


    def add_default_states(self, template):
        template.append(FAILURE_TEMPLATE)
        template.append(NOTHING_LEFT_TEMPLATE)
        template.append(END_TEMPLATE)
        return template

    def parse(self, fp):
        """Upper function for parsing AP syntax to XState"""
        infile = open(fp, 'r', encoding='utf8').read()
        ap = json.loads(open(fp, 'r', encoding='utf8').read())
        self.check_ap(ap)
        template = []
        for idx, question in ap.items():
            template.append(self.reformat(idx, question))
        template = self.add_default_states(template)
        template = ''.join(template)
        template = '{}\n{}'.format(
            self.head,
            template)
        return template 

    def build_db(self, schema):
        if os.path.exists(schema):
            while True:
                overwrite = input('File {0} already exists. Do you REALLY want to overwrite {0}? y/n: '.format(schema))
                if overwrite == 'no' or overwrite == 'n':
                    return
                elif overwrite == 'yes' or overwrite == 'y':
                    break
            # sys.exit()

        with open(schema, 'w+', encoding='utf8') as out:
            out.write('DROP TABLE IF EXISTS user;\n')
            out.write('DROP TABLE IF EXISTS data;\n')
            out.write('DROP TABLE IF EXISTS annotations;\n')
            out.write('DROP TABLE IF EXISTS options;\n')
            
            out.write('\n')
            # Create user table
            table_name = 'user'
            out.write("CREATE TABLE IF NOT EXISTS {}\n".format(table_name) +\
                              "(\nid integer primary key autoincrement not null,\n" +\
                              "username text not null,\n" +\
                              "email text not null,\n" +\
                              "given_name text not null,\n" +\
                              "surname text not null,\n" +\
                              "password text not null,\n" +\
                              "user_type text not null,\n" +\
                              "is_approved text not null,\n" +\
                              "annotated text\n);\n")
            out.write('\n')

            # Create data table
            table_name = 'data'
            out.write("CREATE TABLE IF NOT EXISTS {}\n".format(table_name) +\
                              "(\nid integer primary key autoincrement not null,\n" +\
                              "content text not null,\n" +\
                              "context text,\n" +\
                              "meta text\n);\n")
            out.write('\n')

            # Create annotations table
            table_name = 'annotations'
            columns = ['"{}" text'.format(c) for c in self.columns]

            out.write("CREATE TABLE IF NOT EXISTS {}\n".format(table_name) +\
                              "(\nid integer primary key autoincrement not null,\n" +\
                              "data_id integer not null,\n" +\
                              "user_id integer not null,\n" +\
                              "timestamp TIMESTAMP DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')) NOT NULL,\n" +\
                              ",\n".join(columns) +\
                              "\n);\n")
            out.write('\n')

            out.write('CREATE TABLE IF NOT EXISTS options \n(\nmax_annotations INTEGER DEFAULT 99\n);\n')
            out.write('INSERT INTO options (max_annotations) VALUES (99);\n')



    
def write_template(outfile, template):
    if os.path.exists(outfile):
        # logging.error("File {} already exists, will not overwrite it.".format(outfile))
        while True:
            overwrite = input('File {0} already exists. Do you REALLY want to overwrite {0}? y/n: '.format(outfile))
            if overwrite == 'no' or overwrite == 'n':
                return
            elif overwrite == 'yes' or overwrite == 'y':
                break
        # sys.exit()
    with open(outfile, 'w+', encoding='utf8') as out:
        out.write(template)


if __name__ == '__main__':
    ap = sys.argv[1]
    logging.basicConfig(level=logging.INFO)
    ap_parser = AP_Parser()
    template = ap_parser.parse(ap)
    write_template('static/protocol.ts', template)
    ap_parser.build_db('schema.sql')

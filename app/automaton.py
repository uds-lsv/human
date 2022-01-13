from typing import Optional, OrderedDict, List
# from collections import OrderedDict
from collections import namedtuple
from transitions import Machine, State as Transitions_State
import json
from ruamel.yaml import YAML
from app.db import get_db
from flask_login import current_user
import pickle
from app import error_handler
from app import api

from requests_toolbelt import MultipartEncoder


class State(Transitions_State):
    def __init__(self, name, on_enter=None, on_exit=None,
                ignore_invalid_triggers=None, meta=None, data={}):
        super().__init__(name, on_enter, on_exit, ignore_invalid_triggers)
        self.meta=meta
        self.data=data

    def __repr__(self):
        return "<%s('%s')@%s,%s>" % (type(self).__name__, self.name, id(self), self.meta)

HistoryState = namedtuple('HistoryState',['name','data'])
class AnnotationAutomaton(Machine):

    def __init__(self):
        self.annotations = {}

        self.history: List[HistoryState] = []
        Machine.__init__(self,initial='start', auto_transitions=False,before_state_change=[self.add_state_to_history])
        self.add_state(State(name='end',meta={},on_enter=['write_to_db']))
        self.add_state(State(name='failure',meta={},on_enter=['failure']))
        
    @property
    def current_state(self) -> State:
        '''
        Current state of the automaton.
        '''
        return self.get_model_state(self)

    def add_state_to_history(self, data=None, **kwargs):
        self.history.append(HistoryState(self.current_state.name,data))

    def save(self, data=None, **kwargs): 
        print(self.current_state)
        if self.current_state.name not in ('start','end','failure') and data:
            # self.current_state.data = data['data']
            self.annotations[self.current_state.name] = data['data']['annotation']
        

    def write_to_db(self, **kwargs):
        self.to_start()
        return
        data = self.annotations
        # copy of write to db
        if not data:
                return "No Annotations"
        else:
            data['user_id'] = current_user.get_id()
            if str(self.annotations['data_id']) in current_user.get_annotated().split():
                raise error_handler.DatabaseError("Already annotated", 500)
            # try:
            db = get_db()
            cursor = db.execute('select * from annotations')
            allowed_columns = [d[0] for d in cursor.description]
            for key, v in list(data.items()):
                if key not in allowed_columns:
                    del data[key]
                else:
                    data[key] = str(v)
            db.execute(
                'INSERT INTO annotations ({0}) VALUES ({1})'.format(
                    ', '.join(('"'+str(key)+'"' for key in data)),
                    ', '.join(('?' for key in data))
                ),
                tuple((data[key]) for key in data)
            )
            db.execute(
                'UPDATE user set annotated = ? WHERE id = ?',
                (" ".join([current_user.get_annotated(), str(data['data_id'])]), current_user.get_id())
            )
            # Unconditionally set. If the user completed an annotation, it was current_annotation.
            db.execute("UPDATE user SET current_annotation = 0 WHERE id = ?", (current_user.get_id(),))

            # db.commit() # TODO comment in again
            # transition to start
            self.to_start()

    def save_machine(self, **kwargs):
        db = get_db()
        automaton_pickle = pickle.dumps(self,protocol=pickle.HIGHEST_PROTOCOL)
        db.execute('UPDATE user SET automaton=? WHERE id=?',(automaton_pickle,current_user.id))
        db.commit()

    def failure(self, **kwargs): print('fail')

    def end(self, **kwargs): print('end')

    def get_response(self):
        meta = self.current_state.meta
        payload = {}
        if meta['type'] == 'loadText':
            self.annotations = {}
            # import here to circumvent circular import
            from app.routes import choose_data
            chosen = choose_data()
            if chosen and not isinstance(chosen, str):
                data = chosen.json
                payload = {'state': json.dumps(meta), 'data': json.dumps(data)}
            else:
                return chosen
            self.annotations['data_id'] = data['id']
            self.current_state.data = data

        elif meta['type'] == 'loadImage' or meta['type'] == 'loadPdf':
            self.annotations = {}
            # import here to circumvent circular import
            from app.routes import choose_data
            chosen = choose_data()
            if chosen and not isinstance(chosen, str):
                data = chosen.json
            else:
                return chosen
            self.annotations['data_id'] = data['id']
            self.current_state.data = data

            datafile = "./uploaded_files/"+data['content']
            payload = {'state': json.dumps(meta),
                    'data': json.dumps(data),
                    'file': (datafile, open(datafile, 'rb'))}
        else:
            # TODO handle API calls here
            # TODO possibly add previous states data here as well
            if 'api_call' in self.current_state.meta:
                api_call = getattr(api, self.current_state.meta['api_call'])
                api_ret = api_call(self)
                if type(api_ret) != dict:
                    # TODO better handling of automaton failures
                    return 'API call did not return dict type'
                payload = {'state': json.dumps(meta), 'data': json.dumps(api_ret)}
            elif 'from' in self.current_state.meta:
                from_state = self.current_state.meta['from']
                data = [state for state in self.history if state.name == from_state][-1].data
                payload = {'state': json.dumps(meta), 'data':json.dumps(data['data'])}
            else:
                # payload = {'state': json.dumps(meta), 'data':json.dumps(self.history[-1].data)}
                payload = {'state': json.dumps(meta), 'data':json.dumps({})}
        print('payload', payload)
        multipart = MultipartEncoder(fields=payload)
        self.save_machine()
        return (multipart.to_string(), {'Content-Type': multipart.content_type})

    def print_debug(self, **kwargs): print(self.current_state)




    @staticmethod
    def setup(protocol:str='protocol.yml'):
        # TODO: Check Correctness
        # needs: Transition to end, no unreachable nodes, no unknown task types
        # Build database
        # Handle api calls and predictions

        automaton = AnnotationAutomaton()

        with open(protocol) as f:
            yaml = YAML(typ='safe')
            protocol: dict = next(yaml.load_all(f))

            for state, val in protocol.items():

                for transition in val['transitions']:
                    for trigger in transition:
                        target = transition[trigger]['target']
                        actions = (transition[trigger]['actions'] if 'actions' in transition[trigger] else None)
                        automaton.add_transition(trigger,state,target,before=actions)

                del val['transitions']
                on_exit = ['save']
                # on_exit.extend(['save'] if 'column' in val else [])
                automaton.add_state(State(name=state,meta=val,on_exit=on_exit))

        
        automaton.add_transition('fail', '*', 'failure')
        automaton.add_transition('to_start', '*', 'start')
        # print(automaton.states)
        # print(automaton.get_transitions())
        illegal = automaton.check_machine_validity()
        if len(illegal['unreachable']) !=0 or len(illegal['undefined']) !=0:
            print(f'Unreachable states: {illegal["unreachable"]}')
            print(f'Undefined states: {illegal["undefined"]}')
            exit(0) 
        return automaton
    
    
    def check_machine_validity(self)-> dict[str,set]:
        # TODO: check if this works with wildcards '*' as well
        agenda = [self.initial]
        visited = set()
        illegal_states = {
                "unreachable": set(),
                "undefined": set()
        }
        
        while agenda:
            current_state = agenda.pop()
            visited.add(current_state)

            if current_state not in list(self.states):
                illegal_states["undefined"].add(current_state)
                continue

            for transition in self.get_transitions(source=current_state):
                state = transition.dest
                if state not in visited:
                    agenda.append(state)

        illegal_states["unreachable"] = set([s for s in self.states if s not in visited])

        # also find non-reachable undefined states
        for transition in self.get_transitions():
            if transition.source not in list(self.states):
                illegal_states["undefined"].add(transition.source)
            if transition.dest not in list(self.states):
                illegal_states["undefined"].add(transition.dest)
        return illegal_states
    
    def check_protocol_validity():
        # type always needed
        # state with name start always needed
        # boolean needs transition yes no or *
        # picture tasks need picture loaded
        # text tasks need text loaded
        # from: state must be available before from
        ...

    def get_db_columns(self):
        return [state for state in list(self.states) if state not in ["start", "end", "failure"]]
        


if __name__ == '__main__':
    ...
    # s = State(name='a',data={},on_exit=[])
    # automaton = AnnotationAutomaton.setup_()
    # print(automaton.current_state)
    automaton = AnnotationAutomaton.setup()
    print(automaton.current_state)
    # automaton = AnnotationAutomaton()

    # states=[State(name='blubb',data={'bla':'blubb'},meta=1), State(name='start',data={'bla':'blubb'},meta=2)]

    # automaton.add_states(states)
    # automaton.add_transition('next', 'start', 'blubb', after=['req', 'save'])
    # automaton.add_transition('next', 'blubb', 'start')

    # print(automaton.state)
    # # automaton.next()
    # print(automaton.state)
    # # automaton.next()
    # print(automaton.state)
    # automaton.trigger('next',request="")
    # automaton.next(request='bla')
    # automaton.next(request='blubba')
    # automaton.next(request='bla2')

    # def setup_():
    #     automaton = AnnotationAutomaton()

    #     states=[State(name='blubb',data={'bla':'blubb'},meta=1), State(name='start',data={'bla':'blubb'},meta=2),State(name='3',data={'bla':'blubb'},meta=2),State(name='4',data={'bla':'blubb'},meta=2),State(name='5',data={'bla':'blubb'},meta=2),State(name='6',data={'bla':'blubb'},meta=2),]

    #     automaton.add_states(states)
    #     automaton.add_transition('next', 'start', 'blubb', after=['req', 'save'])
    #     automaton.add_transition('next', 'blubb', '3')
    #     automaton.add_transition('next', '3', '4')
    #     automaton.add_transition('next', '4', '5')
    #     automaton.add_transition('next', '5', '6')
    #     automaton.add_transition('next', '6', 'start')
    #     return automaton
    #     # print(automaton.state)
    #     # print(automaton.states)
    #     # # automaton.next()
    #     # print(automaton.state)
    #     # # automaton.next()
    #     # print(automaton.state)
    #     # automaton.next(request='askjdfn')



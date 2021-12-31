
# import functions from outside algorithms here
# from src import paragraphSegmentation as pseg
# from src import lineSegmentation as lseg
# ....


'''
Write your custom api functions here.
Functions are called by the state machine and triggered by adding a 'call_api' key in protocol.yml
The value has to be the function name

E.g.
protocol.yml

...
example_state
    type: boolean
    question: Example question
    column: example
    api_call: example_function
    transitions:
        - '*':
              target: '1'
...

When entering this state the state machine will call the function named "example_function" with the state machine as its argument.
The current state and previous annotations can be accessed via this argument. If you want to use the api calls for predictions, 
make sure to return a corresponding dictionary. 

def example_function(state_machine):
    ...
    state_machine.annotations['<state>']
    state_machine.current_state.meta['type'] == 'boolean'
    return 

'''

def api_multilabel(state_machine):
    return {'bboxes': [(15.22010770816713, 809.1400920373411, 2466.55127019975, 187.48281384441623)], 'labels' : [
        [ 'fly', 'blackbird', 'dove', 'ant', 'mosquito', 'lion' ],
        [ 'blackbird', 'dove', 'ant', 'mosquito', 'lion', 'fly' ],
        [ 'dove', 'ant', 'mosquito', 'lion', 'fly', 'blackbird' ],
        [ 'ant', 'mosquito', 'lion', 'fly', 'blackbird', 'dove' ],
        [ 'mosquito', 'lion', 'fly', 'blackbird', 'dove', 'ant' ],
        [ 'lion', 'fly', 'blackbird', 'dove', 'ant', 'mosquito' ],
        ]}

def api_singlelabel(state_machine):
    return {'bboxes': [(15.22010770816713, 809.1400920373411, 2466.55127019975, 187.48281384441623)], 'labels' : [
         'fly', 'blackbird', 'dove', 'ant', 'mosquito', 'lion' ]}

import { Data } from './data'
import { Service } from './services/service'
import { blobToDataURL } from './utils'

export const textProtocol = {
    id: 'annotation',
    initial: 'start',
    // strict: true,
    context: {
        annotation: {
            id: -1,
            n_2: '',
            n_3: '',
            n_4: '',
            c_usmod: '',
            c_mod1: '',
            c_mod0: '',
            c_refc: '',
            c_topic: '',
            c_amp: '',
            c_ne_1: '',
            c_ne_2: '',
            c_ne_2_mark: '',
            c_ne_3: '',
            c_ne_4: '',
            c_ne_5: '',
            c_ne_6: '',
            c_ne_7: '',
            c_pe_1: '',
            c_pe_2: '',
            c_pe_2_mark: '',
            c_pe_3: '',
            c_pe_4: '',
            c_pe_5: '',
            c_act: '',
            c_act_1a: '',
            c_act_1b: '',
            c_act_2a: '',
            c_act_2a_mark: '',
            c_act_2b: '',
            c_act_3a: '',
            c_act_3a_mark: '',
            c_act_3b: '',
            c_contr: '',
            c_emo_1: '',
            c_emo_2a: '',
            c_emo_2a_mark: '',
            c_emo_2b: '',
            c_emo_3: '',
        },
    },
    states: {
        // get Data and set to context.data
        start: {
            invoke: {
                id: 'getData',
                src: (_, event) =>
                    Service.get('/api/getdata').then((res) => {
                        Data.reset()
                        Data.data = res
                        Data.annotations['id'] = Data.data.id
                        console.log(res)
                    }),
                onDone: {
                    target: '0',
                    actions: [ 'print', 'setupPage' ],
                },
                onError: {
                    target: 'failure',
                    actions: [ 'print' ],
                },
            },
            meta: {
                type: 'loading',
            },
        },
        // display data for reading
        '0': {
            on: {
                NEXT: '1',
                NOTHINGLEFT: 'nothingleft',
            },
            entry: [ 'showUI' ],
            meta: {
                type: 'read',
                question: 'Read the content and its context below.',
            },
        },
        '1': {
            on: {
                article: {
                    target: 'n_2',
                },
                comment: {
                    target: 'c_usmod',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question: 'Is this an article or a comment?.',
                options: [ 'article', 'comment' ],
            },
        },

        n_2: {
            on: {
                'fact oriented': {
                    target: 'n_3',
                    actions: 'save',
                },
                'opinion oriented': {
                    target: 'n_3',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question:
                    'Is the author of the article emphasizing facts or an opinion?',
                column: 'n_2',
                options: [ 'fact oriented', 'opinion oriented' ],
            },
        },

        n_3: {
            on: {
                'flight/migration NOT main topic': {
                    target: 'end',
                    actions: 'save',
                },
                'management of immigration and political actions concerning asylum policy': {
                    target: 'n_4',
                    actions: 'save',
                },
                'security and safety': {
                    target: 'n_4',
                    actions: 'save',
                },
                justice: {
                    target: 'n_4',
                    actions: 'save',
                },
                'integration and cohabitation': {
                    target: 'n_4',
                    actions: 'save',
                },
                'culture and religion': {
                    target: 'n_4',
                    actions: 'save',
                },
                education: {
                    target: 'n_4',
                    actions: 'save',
                },
                'labor market and economy': {
                    target: 'n_4',
                    actions: 'save',
                },
                'social issues': {
                    target: 'n_4',
                    actions: 'save',
                },
                'health aspects': {
                    target: 'n_4',
                    actions: 'save',
                },
                environment: {
                    target: 'n_4',
                    actions: 'save',
                },
                'media coverage of migrants, migration': {
                    target: 'n_4',
                    actions: 'save',
                },
                'topic cannot be identified': {
                    target: 'n_4',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question: 'What is the topic of the article?',
                column: 'n_3',
                options: [
                    'flight/migration NOT main topic',
                    'management of immigration and political actions concerning asylum policy',
                    'security and safety',
                    'justice',
                    'integration and cohabitation',
                    'culture and religion',
                    'education',
                    'labor market and economy',
                    'social issues',
                    'health aspects',
                    'environment',
                    'media coverage of migrants, migration',
                    'topic cannot be identified',
                ],
            },
        },

        n_4: {
            on: {
                '--Migrants and the phenomenon migration; foreigners in Germany--': {
                    target: 'n_4_add',
                    actions: 'save',
                },
                'Residents of other countries': {
                    target: 'n_4_mark',
                    actions: 'save',
                },
                '--Actors in the political sphere--': {
                    target: 'n_4_add',
                    actions: 'save',
                },
                'CDU/CSU': {
                    target: 'n_4_add',
                    actions: 'save',
                },
                SPD: {
                    target: 'n_4_add',
                    actions: 'save',
                },
                'Die Grünen': {
                    target: 'n_4_add',
                    actions: 'save',
                },
                'Left-wing politicians': {
                    target: 'n_4_add',
                    actions: 'save',
                },
                FDP: {
                    target: 'n_4_add',
                    actions: 'save',
                },
                AfD: {
                    target: 'n_4_add',
                    actions: 'save',
                },
                Government: {
                    target: 'n_4_mark',
                    actions: 'save',
                },
                Opposition: {
                    target: 'n_4_mark',
                    actions: 'save',
                },
                'Left-wing political camp': {
                    target: 'n_4_mark',
                    actions: 'save',
                },
                'Right political camp': {
                    target: 'n_4_mark',
                    actions: 'save',
                },
                'Left-wing extremists': {
                    target: 'n_4_mark',
                    actions: 'save',
                },
                'Right-wing extremists': {
                    target: 'n_4_mark',
                    actions: 'save',
                },
                'Political institutions and public authorities': {
                    target: 'n_4_mark',
                    actions: 'save',
                },
                States: {
                    target: 'n_4_mark',
                    actions: 'save',
                },
                'Foreign politicians/party/government': {
                    target: 'n_4_add',
                    actions: 'save',
                },
                '--The German population--': {
                    target: 'n_4_mark',
                    actions: 'save',
                },
                '--Actors from the media sector--': {
                    target: 'n_4_mark',
                    actions: 'save',
                },
                '--Civil soviety actors--': {
                    target: 'n_4_mark',
                    actions: 'save',
                },
                '--Religious actors--': {
                    target: 'n_4_mark',
                    actions: 'save',
                },
                '--Scientific actors--': {
                    target: 'n_4_mark',
                    actions: 'save',
                },
                '--Police--': {
                    target: 'n_4_mark',
                    actions: 'save',
                },
                '--Courts--': {
                    target: 'n_4_mark',
                    actions: 'save',
                },
                '--Military--': {
                    target: 'n_4_mark',
                    actions: 'save',
                },
                'Not determinable': {
                    target: 'n_4_more',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question:
                    'Which actors are mentioned in the article? (You can add more later.)',
                options: [
                    '--Migrants and the phenomenon migration; foreigners in Germany--',
                    'Residents of other countries',
                    '--Actors in the political sphere--',
                    'CDU/CSU',
                    'SPD',
                    'Die Grünen',
                    'Left-wing politicians',
                    'FDP',
                    'AfD',
                    'Government',
                    'Opposition',
                    'Left-wing political camp',
                    'Right political camp',
                    'Left-wing extremists',
                    'Right-wing extremists',
                    'Political institutions and public authorities',
                    'States',
                    'Foreign politicians/party/government',
                    '--The German population--',
                    '--Actors from the media sector--',
                    '--Civil soviety actors--',
                    '--Religious actors--',
                    '--Scientific actors--',
                    '--Police--',
                    '--Courts--',
                    '--Military--',
                    'Not determinable',
                ],
                column: 'n_4',
            },
        },
        n_4_mark: {
            on: {
                NEXT: {
                    target: 'n_4_more',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                question: 'Please mark the actors.',
                type: 'labeling',
                column: 'n_4_mark',
            },
        },
        n_4_add: {
            on: {
                'case specific': {
                    target: 'n_4_mark',
                    actions: 'save',
                },
                'generalized entity': {
                    target: 'n_4_mark',
                    actions: 'save',
                },
                'cannot tell': {
                    target: 'n_4_mark',
                    actions: 'save',
                },
            },

            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question: 'The actor is...',
                column: 'n_4_add',
                options: [
                    'case specific',
                    'generalized entity',
                    'cannot tell',
                ],
            },
        },
        n_4_more: {
            on: {
                YES: {
                    target: 'n_4',
                },
                NO: {
                    target: 'end',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                type: 'boolean',
                question: 'Are there any more agents?',
            },
        },
        c_usmod: {
            on: {
                'user comment': {
                    target: 'c_mod0',
                    actions: 'save',
                },
                'moderating comment': {
                    target: 'c_mod1',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question: 'What kind of comment is it?',
                column: 'c_usmod',
                options: [ 'user comment', 'moderating comment' ],
            },
        },

        c_mod1: {
            on: {
                'answering a question': {
                    target: 'end',
                    actions: 'save',
                },
                'asking a question': {
                    target: 'end',
                    actions: 'save',
                },
                'correction in an objective manner': {
                    target: 'end',
                    actions: 'save',
                },
                "defending on one's own account": {
                    target: 'end',
                    actions: 'save',
                },
                'appreciation (praise, gratitude)': {
                    target: 'end',
                    actions: 'save',
                },
                'humorous answer': {
                    target: 'end',
                    actions: 'save',
                },
                'reminder of debate culture, referring to the netiquette, announcement of consequences': {
                    target: 'end',
                    actions: 'save',
                },
                'other moderating intervention': {
                    target: 'end',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question:
                    'Which moderation measure is taken? The moderator is...',
                column: 'c_mod1',
                options: [
                    'answering a question',
                    'asking a question',
                    'correction in an objective manner',
                    "defending on one's own account",
                    'appreciation (praise, gratitude)',
                    'humorous answer',
                    'reminder of debate culture, referring to the netiquette, announcement of consequences',
                    'other moderating intervention',
                ],
            },
        },
        c_mod0: {
            on: {
                'makes no reference to the news article': {
                    target: 'c_refc',
                    actions: 'save',
                },
                'approval of the article': {
                    target: 'c_refc',
                    actions: 'save',
                },
                'refusal of the article': {
                    target: 'c_refc',
                    actions: 'save',
                },
                'agrees with the article, but also rejects it (ambivalent)': {
                    target: 'c_refc',
                    actions: 'save',
                },
                'attacks the author of the article or the medium itself': {
                    target: 'c_refc',
                    actions: 'save',
                },
                'establishes a reference to the topic of the article (without evaluating it)': {
                    target: 'c_refc',
                    actions: 'save',
                },
                'cannot be decided': {
                    target: 'c_refc',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question:
                    'Is a reference to the media article included in the comment?',
                column: 'c_mod0',
                options: [
                    'makes no reference to the news article',
                    'approval of the article',
                    'refusal of the article',
                    'agrees with the article, but also rejects it (ambivalent)',
                    'attacks the author of the article or the medium itself',
                    'establishes a reference to the topic of the article (without evaluating it)',
                    'cannot be decided',
                ],
            },
        },
        c_refc: {
            on: {
                'does not refer to another comment': {
                    target: 'c_topic',
                    actions: 'save',
                },
                'agreement or other positive reaction to another comment': {
                    target: 'c_topic',
                    actions: 'save',
                },
                'disagreement or other negative reaction to another comment': {
                    target: 'c_topic',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question:
                    'Does the comment relate to another comment and if so, how?',
                column: 'c_refc',
                options: [
                    'does not refer to another comment',
                    'agreement or other positive reaction to another comment',
                    'disagreement or other negative reaction to another comment',
                ],
            },
        },
        c_topic: {
            on: {
                'management of immigration and political actions concerning asylum policy': {
                    target: 'c_amp',
                    actions: 'save',
                },
                'security and safety': {
                    target: 'c_amp',
                    actions: 'save',
                },
                justice: {
                    target: 'c_amp',
                    actions: 'save',
                },
                'integration and cohabitation': {
                    target: 'c_amp',
                    actions: 'save',
                },
                'culture and religion': {
                    target: 'c_amp',
                    actions: 'save',
                },
                eduaction: {
                    target: 'c_amp',
                    actions: 'save',
                },
                'labor market and economy': {
                    target: 'c_amp',
                    actions: 'save',
                },
                'social issues': {
                    target: 'c_amp',
                    actions: 'save',
                },
                'health aspects': {
                    target: 'c_amp',
                    actions: 'save',
                },
                environment: {
                    target: 'c_amp',
                    actions: 'save',
                },
                'media coverage': {
                    target: 'c_amp',
                    actions: 'save',
                },
                'topic cannot be identified': {
                    target: 'c_amp',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question: 'What is the topic of the comment?',
                column: 'c_topic',
                options: [
                    'management of immigration and political actions concerning asylum policy',
                    'security and safety',
                    'justice',
                    'integration and cohabitation',
                    'culture and religion',
                    'eduaction',
                    'labor market and economy',
                    'social issues',
                    'health aspects',
                    'environment',
                    'media coverage',
                    'topic cannot be identified',
                ],
            },
        },
        c_amp: {
            on: {
                yes: {
                    target: 'c_ne_1',
                    actions: 'save',
                },
                no: {
                    target: 'c_ne_1',
                    actions: 'save',
                },
                'cannot tell': {
                    target: 'c_ne_1',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question: 'Are there ay amplifiers in the comment?',
                column: 'c_amp',
                options: [ 'yes', 'no', 'cannot tell' ],
            },
        },
        c_ne_1: {
            on: {
                yes: {
                    target: 'c_ne_2',
                    actions: 'save',
                },
                no: {
                    target: 'c_ne_2',
                    actions: 'save',
                },
                'cannot tell': {
                    target: 'c_ne_2',
                    actions: 'save',
                },
            },

            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question:
                    'Is the negative evaluation implicit in the comment?',
                column: 'c_ne_1',
                options: [ 'yes', 'no', 'cannot tell' ],
            },
        },
        c_ne_2: {
            on: {
                '--Migrants and the phenomenon migration; foreigners in Germany--': {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                'Residents of other countries': {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                '--Actors in the political sphere--': {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                'CDU/CSU': {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                SPD: {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                'Die Grünen': {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                'Left-wing politicians': {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                FDP: {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                AfD: {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                Government: {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                Opposition: {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                'Left-wing political camp': {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                'Right political camp': {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                'Left-wing extremists': {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                'Right-wing extremists': {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                'Political institutions and public authorities': {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                States: {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                'Foreign politicians/party/government': {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                '--The German population--': {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                '--Actors from the media sector--': {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                '--Civil soviety actors--': {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                '--Religious actors--': {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                '--Scientific actors--': {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                '--Police--': {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                '--Courts--': {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                '--Military--': {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                '--Abstract entities--': {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                '--Co-discussants--': {
                    target: 'c_ne_2_mark',
                    actions: 'save',
                },
                'Not determinable': {
                    target: 'c_ne_4',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question:
                    'The agent that gets negatively evaluated is...? (You can later add more.)',
                options: [
                    '--Migrants and the phenomenon migration; foreigners in Germany--',
                    'Residents of other countries',
                    '--Actors in the political sphere--',
                    'CDU/CSU',
                    'SPD',
                    'Die Grünen',
                    'Left-wing politicians',
                    'FDP',
                    'AfD',
                    'Government',
                    'Opposition',
                    'Left-wing political camp',
                    'Right political camp',
                    'Left-wing extremists',
                    'Right-wing extremists',
                    'Political institutions and public authorities',
                    'States',
                    'Foreign politicians/party/government',
                    '--The German population--',
                    '--Actors from the media sector--',
                    '--Civil soviety actors--',
                    '--Religious actors--',
                    '--Scientific actors--',
                    '--Police--',
                    '--Courts--',
                    '--Military--',
                    '--Abstract entities--',
                    '--Co-discussants--',
                    'Not determinable',
                ],
                column: 'c_ne_2',
            },
        },
        c_ne_2_mark: {
            on: {
                NEXT: {
                    target: 'c_ne_3',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                question:
                    'Please mark the agents that get negatively evaluated.',
                type: 'labeling',
                column: 'c_ne_2_mark',
            },
        },
        c_ne_3: {
            on: {
                'case specific': {
                    target: 'c_ne_4',
                    actions: 'save',
                },
                'generalized entity': {
                    target: 'c_ne_4',
                    actions: 'save',
                },
                'cannot tell': {
                    target: 'c_ne_4',
                    actions: 'save',
                },
            },

            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question: 'The agent negatively evaluated is...',
                column: 'c_ne_3',
                options: [
                    'case specific',
                    'generalized entity',
                    'cannot tell',
                ],
            },
        },
        c_ne_4: {
            on: {
                NEXT: {
                    target: 'c_ne_4_mark',
                    actions: 'save',
                },
            },

            entry: [ 'showUI' ],
            meta: {
                type: 'checkmark',
                question:
                    'The nature of/reason for the negative evaluation is...',
                column: 'c_ne_4',
                options: [
                    'passivity, e.g. lack of courage, lack of measures, inefficiency',
                    'conspiracy/hypocrisy/dishonesty/manipulation of opinion',
                    'ignorance, naivety, indifference',
                    'specific illegal, criminal behavior, including violence',
                    'financial burdon e.g. on the welfare state, municipalitites',
                    'incompatibility with cultural norms',
                    'invasion',
                    'illness',
                    'characteristics',
                    'political conviction, opinion, ideology',
                    'cannot be identified',
                ],
            },
        },
        c_ne_4_mark: {
            on: {
                NEXT: {
                    target: 'c_ne_5',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                question:
                    'Please mark the nature/reason for the negative evaluation.',
                column: 'c_ne_4_mark',
                type: 'labeling',
            },
        },
        c_ne_5: {
            on: {
                '--Migrants and the phenomenon migration; foreigners in Germany--': {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                'Residents of other countries': {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                '--Actors in the political sphere--': {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                'CDU/CSU': {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                SPD: {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                'Die Grünen': {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                'Left-wing politicians': {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                FDP: {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                AfD: {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                Government: {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                Opposition: {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                'Left-wing political camp': {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                'Right political camp': {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                'Left-wing extremists': {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                'Right-wing extremists': {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                'Political institutions and public authorities': {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                States: {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                'Foreign politicians/party/government': {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                '--The German population--': {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                '--Actors from the media sector--': {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                '--Civil soviety actors--': {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                '--Religious actors--': {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                '--Scientific actors--': {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                '--Police--': {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                '--Courts--': {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                '--Military--': {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                '--Abstract entities--': {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                '--Co-discussants--': {
                    target: 'c_ne_5_mark',
                    actions: 'save',
                },
                'Not determinable': {
                    target: 'c_ne_6',
                    actions: 'save',
                },
            },

            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question: "The victim of the agent's behavior is...",
                column: 'c_ne_5',
                options: [
                    '--Migrants and the phenomenon migration; foreigners in Germany--',
                    'Residents of other countries',
                    '--Actors in the political sphere--',
                    'CDU/CSU',
                    'SPD',
                    'Die Grünen',
                    'Left-wing politicians',
                    'FDP',
                    'AfD',
                    'Government',
                    'Opposition',
                    'Left-wing political camp',
                    'Right political camp',
                    'Left-wing extremists',
                    'Right-wing extremists',
                    'Political institutions and public authorities',
                    'States',
                    'Foreign politicians/party/government',
                    '--The German population--',
                    '--Actors from the media sector--',
                    '--Civil soviety actors--',
                    '--Religious actors--',
                    '--Scientific actors--',
                    '--Police--',
                    '--Courts--',
                    '--Military--',
                    '--Abstract entities--',
                    '--Co-discussants--',
                    'Not determinable',
                ],
            },
        },
        c_ne_5_mark: {
            on: {
                NEXT: {
                    target: 'c_ne_6',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                question:
                    "Please mark the victim of the agent's behavior.",
                type: 'labeling',
                column: 'c_ne_5_mark',
            },
        },
        c_ne_6: {
            on: {
                yes: {
                    target: 'c_ne_7',
                    actions: 'save',
                },
                no: {
                    target: 'c_ne_7',
                    actions: 'save',
                },
                'cannot tell': {
                    target: 'c_ne_7',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question: 'Does the comment contain irony-sarcasm?',
                column: 'c_ne_6',
                options: [ 'yes', 'no', 'cannot tell' ],
            },
        },
        c_ne_7: {
            on: {
                yes: {
                    target: 'c_ne_8',
                    actions: 'save',
                },
                no: {
                    target: 'c_ne_8',
                    actions: 'save',
                },
                'cannot tell': {
                    target: 'c_ne_8',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question: 'The negative evaluation comprises swearwords.',
                column: 'c_ne_7',
                options: [ 'yes', 'no', 'cannot tell' ],
            },
        },
        c_ne_8: {
            on: {
                YES: {
                    target: 'c_ne_2',
                },
                NO: {
                    target: 'c_pe_1',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                type: 'boolean',
                question:
                    'Are there any more negatively evaluated agents in the comment?',
            },
        },

        c_pe_1: {
            on: {
                yes: {
                    target: 'c_pe_2',
                    actions: 'save',
                },
                no: {
                    target: 'c_pe_2',
                    actions: 'save',
                },
                'cannot tell': {
                    target: 'c_pe_2',
                    actions: 'save',
                },
            },

            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question:
                    'Is the positive evaluation implicit in the comment?',
                column: 'c_pe_1',
                options: [ 'yes', 'no', 'cannot tell' ],
            },
        },
        c_pe_2: {
            on: {
                '--Migrants and the phenomenon migration; foreigners in Germany--': {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                'Residents of other countries': {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                '--Actors in the political sphere--': {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                'CDU/CSU': {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                SPD: {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                'Die Grünen': {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                'Left-wing politicians': {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                FDP: {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                AfD: {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                Government: {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                Opposition: {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                'Left-wing political camp': {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                'Right political camp': {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                'Left-wing extremists': {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                'Right-wing extremists': {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                'Political institutions and public authorities': {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                States: {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                'Foreign politicians/party/government': {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                '--The German population--': {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                '--Actors from the media sector--': {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                '--Civil soviety actors--': {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                '--Religious actors--': {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                '--Scientific actors--': {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                '--Police--': {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                '--Courts--': {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                '--Military--': {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                '--Abstract entities--': {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                '--Co-discussants--': {
                    target: 'c_pe_2_mark',
                    actions: 'save',
                },
                'Not determinable': {
                    target: 'c_pe_4',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question:
                    'The agent that gets positively evaluated is...? (You can later add more.)',
                options: [
                    '--Migrants and the phenomenon migration; foreigners in Germany--',
                    'Residents of other countries',
                    '--Actors in the political sphere--',
                    'CDU/CSU',
                    'SPD',
                    'Die Grünen',
                    'Left-wing politicians',
                    'FDP',
                    'AfD',
                    'Government',
                    'Opposition',
                    'Left-wing political camp',
                    'Right political camp',
                    'Left-wing extremists',
                    'Right-wing extremists',
                    'Political institutions and public authorities',
                    'States',
                    'Foreign politicians/party/government',
                    '--The German population--',
                    '--Actors from the media sector--',
                    '--Civil soviety actors--',
                    '--Religious actors--',
                    '--Scientific actors--',
                    '--Police--',
                    '--Courts--',
                    '--Military--',
                    '--Abstract entities--',
                    '--Co-discussants--',
                    'Not determinable',
                ],
                column: 'c_pe_2',
            },
        },
        c_pe_2_mark: {
            on: {
                NEXT: {
                    target: 'c_pe_3',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                question:
                    'Please mark the agent that gets positively evaluated.',
                type: 'labeling',
                column: 'c_pe_2_mark',
            },
        },
        c_pe_3: {
            on: {
                'case specific': {
                    target: 'c_pe_4',
                    actions: 'save',
                },
                'generalized entity': {
                    target: 'c_pe_4',
                    actions: 'save',
                },
                'cannot tell': {
                    target: 'c_pe_4',
                    actions: 'save',
                },
            },

            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question: 'The agent positively evaluated is...',
                column: 'c_pe_3',
                options: [
                    'case specific',
                    'generalized entity',
                    'cannot tell',
                ],
            },
        },
        c_pe_4: {
            on: {
                NEXT: {
                    target: 'c_pe_4_mark',
                    actions: 'save',
                },
            },

            entry: [ 'showUI' ],
            meta: {
                type: 'checkmark',
                question:
                    'The nature of/reason for the positive evaluation is...',
                column: 'c_pe_4',
                options: [
                    'efficiency, drive',
                    'honesty, transparency, ethos',
                    'astuteness, seeing things through',
                    'exemplary behavior',
                    'economic or financial advantages, relief of the social system',
                    'cultural enrichment',
                    'character traits',
                    'political conviction, opinion, ideology',
                    'cannot be determined',
                ],
            },
        },
        c_pe_4_mark: {
            on: {
                NEXT: {
                    target: 'c_pe_5',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                question:
                    'Please mark the nature/reason of the positive evaluation.',
                type: 'labeling',
                column: 'c_pe_4_mark',
            },
        },
        c_pe_5: {
            on: {
                yes: {
                    target: 'c_pe_6',
                    actions: 'save',
                },
                no: {
                    target: 'c_pe_6',
                    actions: 'save',
                },
                'cannot tell': {
                    target: 'c_pe_6',
                    actions: 'save',
                },
            },

            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question: 'Does the comment contain irony-sarcasm?',
                column: 'c_pe_5',
                options: [ 'yes', 'no', 'cannot tell' ],
            },
        },

        c_pe_6: {
            on: {
                YES: {
                    target: 'c_act',
                },
                NO: {
                    target: 'c_act',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                type: 'boolean',
                question:
                    'Are there any more positively evaluated agents in the comment?',
            },
        },

        c_act: {
            on: {
                'no action': {
                    target: 'c_contr',
                    actions: 'save',
                },
                'explicit action': {
                    target: 'c_act_1a',
                    actions: 'save',
                },
                'implicit action': {
                    target: 'c_act_1b',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question:
                    'Is an action proposed or an action tendency expressed?',
                column: 'c_act',
                options: [
                    'no action',
                    'explicit action',
                    'implicit action',
                ],
            },
        },

        c_act_1a: {
            on: {
                'positive treatment or claim': {
                    target: 'c_act_1a_mark',
                    actions: 'save',
                },
                'call for change/adaption': {
                    target: 'c_act_1a_mark',
                    actions: 'save',
                },
                'negative but violence-free treatment': {
                    target: 'c_act_1a_mark',
                    actions: 'save',
                },
                'physical violence': {
                    target: 'c_act_1a_mark',
                    actions: 'save',
                },
                'elimination/killing': {
                    target: 'c_act_1a_mark',
                    actions: 'save',
                },
                'cannot tell': {
                    target: 'c_act_2a',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question:
                    'The explicitly formulated action consists of what?',
                column: 'c_act_1a',
                options: [
                    'positive treatment or claim',
                    'call for change/adaption',
                    'negative but violence-free treatment',
                    'physical violence',
                    'elimination/killing',
                    'cannot tell',
                ],
            },
        },
        c_act_1a_mark: {
            on: {
                NEXT: {
                    target: 'c_act_2a',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                question: 'Please mark the explicitly formulated action.',
                type: 'labeling',
                column: 'c_act_1a_mark',
            },
        },

        c_act_1b: {
            on: {
                'positive treatment or claim': {
                    target: 'c_act_1b_mark',
                    actions: 'save',
                },
                'call for change/adaption': {
                    target: 'c_act_1b_mark',
                    actions: 'save',
                },
                'negative but violence-free treatment': {
                    target: 'c_act_1b_mark',
                    actions: 'save',
                },
                'physical violence': {
                    target: 'c_act_1b_mark',
                    actions: 'save',
                },
                'elimination/killing': {
                    target: 'c_act_1b_mark',
                    actions: 'save',
                },
                'cannot tell': {
                    target: 'c_act_2a',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question:
                    'The implicitly formulated action consists of what?',
                column: 'c_act_1b',
                options: [
                    'positive treatment or claim',
                    'call for change/adaption',
                    'negative but violence-free treatment',
                    'physical violence',
                    'elimination/killing',
                    'cannot tell',
                ],
            },
        },
        c_act_1b_mark: {
            on: {
                NEXT: {
                    target: 'c_act_2a',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                question: 'Please mark the implicitly formulated action.',
                type: 'labeling',
                column: 'c_act_1b_mark',
            },
        },

        c_act_2a: {
            on: {
                '--Migrants and the phenomenon migration; foreigners in Germany--': {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                'Residents of other countries': {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                '--Actors in the political sphere--': {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                'CDU/CSU': {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                SPD: {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                'Die Grünen': {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                'Left-wing politicians': {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                FDP: {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                AfD: {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                Government: {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                Opposition: {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                'Left-wing political camp': {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                'Right political camp': {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                'Left-wing extremists': {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                'Right-wing extremists': {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                'Political institutions and public authorities': {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                States: {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                'Foreign politicians/party/government': {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                '--The German population--': {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                '--Actors from the media sector--': {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                '--Civil soviety actors--': {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                '--Religious actors--': {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                '--Scientific actors--': {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                '--Police--': {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                '--Courts--': {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                '--Military--': {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                '--Abstract entities--': {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                '--Co-discussants--': {
                    target: 'c_act_2a_mark',
                    actions: 'save',
                },
                'Not determinable': {
                    target: 'c_act_3a',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question: 'Who should undertake the action?',
                options: [
                    '--Migrants and the phenomenon migration; foreigners in Germany--',
                    'Residents of other countries',
                    '--Actors in the political sphere--',
                    'CDU/CSU',
                    'SPD',
                    'Die Grünen',
                    'Left-wing politicians',
                    'FDP',
                    'AfD',
                    'Government',
                    'Opposition',
                    'Left-wing political camp',
                    'Right political camp',
                    'Left-wing extremists',
                    'Right-wing extremists',
                    'Political institutions and public authorities',
                    'States',
                    'Foreign politicians/party/government',
                    '--The German population--',
                    '--Actors from the media sector--',
                    '--Civil soviety actors--',
                    '--Religious actors--',
                    '--Scientific actors--',
                    '--Police--',
                    '--Courts--',
                    '--Military--',
                    '--Abstract entities--',
                    '--Co-discussants--',
                    'Not determinable',
                ],
                column: 'c_act_2a',
            },
        },

        c_act_2a_mark: {
            on: {
                NEXT: {
                    target: 'c_act_2b',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                question:
                    'Please mark the entity that should undertake the action.',
                type: 'labeling',
                column: 'c_act_2a_mark',
            },
        },

        c_act_2b: {
            on: {
                'case specific': {
                    target: 'c_act_3a',
                    actions: 'save',
                },
                'generalized entity': {
                    target: 'c_act_3a',
                    actions: 'save',
                },
                'cannot tell': {
                    target: 'c_act_3a',
                    actions: 'save',
                },
            },

            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question: 'The actor is...',
                column: 'c_act_2b',
                options: [
                    'case specific',
                    'generalized entity',
                    'cannot tell',
                ],
            },
        },
        c_act_3a: {
            on: {
                '--Migrants and the phenomenon migration; foreigners in Germany--': {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                'Residents of other countries': {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                '--Actors in the political sphere--': {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                'CDU/CSU': {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                SPD: {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                'Die Grünen': {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                'Left-wing politicians': {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                FDP: {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                AfD: {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                Government: {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                Opposition: {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                'Left-wing political camp': {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                'Right political camp': {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                'Left-wing extremists': {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                'Right-wing extremists': {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                'Political institutions and public authorities': {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                States: {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                'Foreign politicians/party/government': {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                '--The German population--': {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                '--Actors from the media sector--': {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                '--Civil soviety actors--': {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                '--Religious actors--': {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                '--Scientific actors--': {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                '--Police--': {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                '--Courts--': {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                '--Military--': {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                '--Abstract entities--': {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                '--Co-discussants--': {
                    target: 'c_act_3a_mark',
                    actions: 'save',
                },
                'Not determinable': {
                    target: 'c_contr',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question: 'Who should endure the action?',
                options: [
                    '--Migrants and the phenomenon migration; foreigners in Germany--',
                    'Residents of other countries',
                    '--Actors in the political sphere--',
                    'CDU/CSU',
                    'SPD',
                    'Die Grünen',
                    'Left-wing politicians',
                    'FDP',
                    'AfD',
                    'Government',
                    'Opposition',
                    'Left-wing political camp',
                    'Right political camp',
                    'Left-wing extremists',
                    'Right-wing extremists',
                    'Political institutions and public authorities',
                    'States',
                    'Foreign politicians/party/government',
                    '--The German population--',
                    '--Actors from the media sector--',
                    '--Civil soviety actors--',
                    '--Religious actors--',
                    '--Scientific actors--',
                    '--Police--',
                    '--Courts--',
                    '--Military--',
                    '--Abstract entities--',
                    '--Co-discussants--',
                    'Not determinable',
                ],
                column: 'c_act_3a',
            },
        },
        c_act_3a_mark: {
            on: {
                NEXT: {
                    target: 'c_act_3b',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                question: 'Please mark the entity enduring the action.',
                type: 'labeling',
                column: 'c_act_3a_mark',
            },
        },

        c_act_3b: {
            on: {
                'case specific': {
                    target: 'c_contr',
                    actions: 'save',
                },
                'generalized entity': {
                    target: 'c_contr',
                    actions: 'save',
                },
                'cannot tell': {
                    target: 'c_contr',
                    actions: 'save',
                },
            },

            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question: 'The patient in question is...',
                column: 'c_act_3b',
                options: [
                    'case specific',
                    'generalized entity',
                    'cannot tell',
                ],
            },
        },
        c_contr: {
            on: {
                NEXT: {
                    target: 'c_emo_1',
                    actions: 'save',
                },
            },

            entry: [ 'showUI' ],
            meta: {
                type: 'checkmark',
                question:
                    'The groups/categories/persons opposed/contrasted/juxtaposed are...',
                column: 'c_contr',
                options: [
                    'elite vs the people',
                    'globalism vs state(s)',
                    'right-wing vs. left-wing camps',
                    'less advantages citizens vs. migrants',
                    'French vs. migrants',
                    'Germans vs. migrants',
                    'French vs. other political actors abroad',
                    'Germans vs. other political actors abroad',
                    'Europeans/westerners vs. others',
                    'pro-migrants vs. anti-migrants',
                    'good migrants vs. bad migrants',
                    'present vs. past',
                    'cannot tell',
                ],
            },
        },
        c_emo_1: {
            on: {
                'no explicit emotional expression': {
                    target: 'c_emo_2a',
                    actions: 'save',
                },
                'negative emotions': {
                    target: 'c_emo_1_mark',
                    actions: 'save',
                },
                'expression of amusement about or ridiculing a target': {
                    target: 'c_emo_1_mark',
                    actions: 'save',
                },
                unclear: {
                    target: 'c_emo_2a',
                    actions: 'save',
                },
            },

            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question: 'Is there an explicit expression of emotions?',
                column: 'c_emo_1',
                options: [
                    'no explicit emotional expression',
                    'negative emotions',
                    'expression of amusement about or ridiculing a target',
                    'unclear',
                ],
            },
        },
        c_emo_1_mark: {
            on: {
                NEXT: {
                    target: 'c_emo_2a',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                question:
                    'Please mark the explicit expression of emotions or the ridiculing of the target.',
                type: 'labeling',
                column: 'c_emo_1_mark',
            },
        },
        c_emo_2a: {
            on: {
                '--Migrants and the phenomenon migration; foreigners in Germany--': {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                'Residents of other countries': {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                '--Actors in the political sphere--': {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                'CDU/CSU': {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                SPD: {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                'Die Grünen': {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                'Left-wing politicians': {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                FDP: {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                AfD: {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                Government: {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                Opposition: {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                'Left-wing political camp': {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                'Right political camp': {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                'Left-wing extremists': {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                'Right-wing extremists': {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                'Political institutions and public authorities': {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                States: {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                'Foreign politicians/party/government': {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                '--The German population--': {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                '--Actors from the media sector--': {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                '--Civil soviety actors--': {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                '--Religious actors--': {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                '--Scientific actors--': {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                '--Police--': {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                '--Courts--': {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                '--Military--': {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                '--Abstract entities--': {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                '--Co-discussants--': {
                    target: 'c_emo_2a_mark',
                    actions: 'save',
                },
                'Not determinable': {
                    target: 'c_emo_3',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question:
                    'Who is the target of the emotion that commentators express?',
                options: [
                    '--Migrants and the phenomenon migration; foreigners in Germany--',
                    'Residents of other countries',
                    '--Actors in the political sphere--',
                    'CDU/CSU',
                    'SPD',
                    'Die Grünen',
                    'Left-wing politicians',
                    'FDP',
                    'AfD',
                    'Government',
                    'Opposition',
                    'Left-wing political camp',
                    'Right political camp',
                    'Left-wing extremists',
                    'Right-wing extremists',
                    'Political institutions and public authorities',
                    'States',
                    'Foreign politicians/party/government',
                    '--The German population--',
                    '--Actors from the media sector--',
                    '--Civil soviety actors--',
                    '--Religious actors--',
                    '--Scientific actors--',
                    '--Police--',
                    '--Courts--',
                    '--Military--',
                    '--Abstract entities--',
                    '--Co-discussants--',
                    'Not determinable',
                ],
                column: 'c_emo_2a',
            },
        },
        c_emo_2a_mark: {
            on: {
                NEXT: {
                    target: 'c_emo_2b',
                    actions: 'save',
                },
            },
            entry: [ 'showUI' ],
            meta: {
                question: 'Please mark the target of emotions.',
                type: 'labeling',
                column: 'c_emo_2a_mark',
            },
        },
        c_emo_2b: {
            on: {
                'case specific': {
                    target: 'c_emo_3',
                    actions: 'save',
                },
                'generalized entity': {
                    target: 'c_emo_3',
                    actions: 'save',
                },
                'cannot tell': {
                    target: 'c_emo_3',
                    actions: 'save',
                },
            },

            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question: 'The recipient of emotions is...',
                column: 'c_emo_2b',
                options: [
                    'case specific',
                    'generalized entity',
                    'cannot tell',
                ],
            },
        },
        c_emo_3: {
            on: {
                yes: {
                    target: 'end',
                    actions: 'save',
                },
                no: {
                    target: 'end',
                    actions: 'save',
                },
                'cannot tell': {
                    target: 'end',
                    actions: 'save',
                },
            },

            entry: [ 'showUI' ],
            meta: {
                type: 'select',
                question: 'Does the comment include irony or sarcasm?',
                column: 'c_emo_3',
                options: [ 'yes', 'no', 'cannot tell' ],
            },
        },

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
                            throw Error('Write to db failed.')
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
        },
        nothingleft: {
            invoke: {
                id: 'nothingleft',
                src: (_, event) => () => {
                    alert('No data left. Please upload new files.')
                },
            },
        },

        // UTIL
        failure: {
            invoke: {
                id: 'failure',
                src: (_, event) => () => {
                    alert('there was an error')
                    return null
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
            meta: {
                type: 'loading',
            },
        },
    },
}

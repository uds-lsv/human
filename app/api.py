
# import functions from outside algorithms here
# from src import paragraphSegmentation as pseg
# from src import lineSegmentation as lseg
# ....

# Write your custom api functions here
# Functions are called by sending a post request to /api/callAPI
# with a json containing the attribute api_call which corresponds 
# to the desired function's name.
# Other attributes will be the parameters of the function
# E.g. 
# 
# JSON: {"api_call": "foo", "arg1": "bar"}
# function call: foo(bar)
# 
# a corresponding function has to exist in this file:
# def foo(arg1):
#   ...
# 

# If you need to upload a file as is and/or cannot convert it into some form of string, 
# then use /api/callAPIfileup 

def paragraph_segmentation(image, bboxes):
    """Starts paragraph Segmentation

    :param imagefile: Filepath to png image file
    :return Coordinates of paragraph box in the picture. (x, y, width, height)
    """
    # pseg.start(imagefile)
    # return [(33.56035539215692, 305.19607843137254, 356.0355392156862, 119.60784313725483), (120.70065014178937, 844.3854387071398, 848.5746823824369, 209.86732906765405), (43.555344141561434, 334.0222660312635, 348.7056315197335, 99.81310213818384)]
    # return [(120.70065014178937, 844.3854387071398, 848.5746823824369, 209.86732906765405)]
    return {'image': image, 'bboxes': [(222.3932822467473, 1446.7973354408405, 2260.5382544559275, 376.81479168388444)]}
    # return [(212, 288, 200, 200)]

def line_segmentation(image, bboxes):
    """Starts line Segmentation

    :param coordinates: Coordinates of user-corrected paragraph box. (x, y, width, height)
    :return List of line boxes. [(x, y, width, height),..]
    """
    return {'image': image, 'bboxes': [(386.2752021963534, 1592.336835735948, 1970.6109440874422, 91.96892891299626), (385.02950078461225, 1485.589595247311, 2044.3504239100241, 96.59126725064723), (315.25130034357704, 1673.153012907829, 1276.4840618438636, 125.67295842252058)]}
    # return [(52.6953125, 362.5, 334.765625, 25.000000000000007), (24.68780637254902, 331.34313725490193, 368.780637254902, 34.31372549019605)]
    # return [(1, 0, 100, 100), (200, 200, 200, 200)]


def word_segmentation(image, bboxes):
    """Starts word Segmentation

    :param coordinates: Coordinates of user-corrected line boxes [(x, y, width, height),..]
    :return list of word boxes [(x, y, width, height),..]
    """
    return {'image': image, 'bboxes': [(414.3523456037963, 1488.61646234676, 181.61990556660064, 100), (632.7543424317619, 1492.796238700078, 210, 100.23939650527278), (881.4543716596679, 1488.4543036907312, 338.22726784691736, 105.40312641888826), (1220.8559750190877, 1488.61646234676, 248.75408594197359, 109.45709281961474), (1488.3211401269327, 1480.346370889278, 284.5433587039511, 121.61899202179417), (1767.7160628221036, 1480.184212233249, 296.473116291277, 117.56502562106766), (2083.2767912531017, 1467.3736784069533, 347.7337934243175, 125.67295842252058), (314.67158868581794, 1584.938704028021, 224.89457076732197, 109.45709281961472), (538.8317337516702, 1601.6410455990142, 266.6487223229624, 89.18726081598238)]}
def classify_words(image, bboxes):
    """Starts word Classification

    :param coordinates: Coordinates of user-corrected word boxes [(x, y, width, height),..]
    :return coordinates and list of word boxes [(x, y, width, height),..], [(x, y, width, height),..]
    """
    # print([['Chien', 'Chat', 'Scorpion', 'Springbok', 'lion']] * len(bboxes))
    return {'image': image, 'bboxes': bboxes, 'predicted_words': [['Chien', 'Chat', 'Scorpion', 'Springbok', 'lion']] * len(bboxes)}

def input_real_words(inputCoordinates, labels):
    """A function that starts word Segmentation

    :param inputCoordinates: corrected coordinates
    :param labels: corrected words
    
    :return True
    """
    return True

def _convert_box():
    pass

def _convert_boxr():
    pass

# import functions from outside algorithms here
# from src import paragraphSegmentation as pseg
# from src import lineSegmentation as lseg
# ....

from PIL import Image
import base64
from io import BytesIO

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

    return {'image': image, 'bboxes': [(222.3932822467473, 1446.7973354408405, 2260.5382544559275, 376.81479168388444)]}

def line_segmentation(image, bboxes):
    """Starts line Segmentation

    :param coordinates: Coordinates of user-corrected paragraph box. (x, y, width, height)
    :return List of line boxes. [(x, y, width, height),..]
    """

    # crop picture to size of bbox
    (x,y,w,h) = bboxes[0]
    splitted = image.split(',')
    im = Image.open(BytesIO(base64.b64decode(image.split(',')[1])))
    scalex = 2500 / im.size[0]
    scaley = 2500 / im.size[1]
    _x = x / scalex
    _y = y / scaley
    _x2 = _x + (w / scalex)
    _y2 = _y + (h / scaley)
    im = im.crop((_x, _y, _x2, _y2))
    buffered = BytesIO()

    im.save(buffered, format="png")
    image = splitted[0]+ ',' + base64.b64encode(buffered.getvalue()).decode()

    # calculate estimates for line bboxes (assume 4 lines)
    y = 0
    lineh = 2500/4
    newbboxes = []
    for _ in range(4):
        newbboxes.append((0,y,2500,lineh))
        y+=lineh
    return {'image': image, 'bboxes': newbboxes}



def word_segmentation(image, bboxes):
    """Starts word Segmentation

    :param coordinates: Coordinates of user-corrected line boxes [(x, y, width, height),..]
    :return list of word boxes [(x, y, width, height),..]
    """
    newbboxes = []
    for line in bboxes:
        (x,y,w,h) = line
        wordw = w/6
        for _ in range(6):
            newbboxes.append((x,y,wordw,h))
            x+=wordw
    return {'image': image, 'bboxes': newbboxes}

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
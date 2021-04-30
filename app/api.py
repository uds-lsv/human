
# import functions from outside algorithms here
# from src import paragraphSegmentation as pseg
# from src import lineSegmentation as lseg
# ....

from PIL import Image
import base64
from io import BytesIO
import pandas as pd
from ast import literal_eval

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



def hardcoded_lines(image, bboxes):
    print(bboxes)
    # (x,y,w,h) = bboxes[0]
    (x,y,w,h) = (0,0,2500,2500)
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
    y = 802
    lineh = 2500/4
    lineh = 179
    newbboxes = []
    for _ in range(5):
        newbboxes.append((0,y,2500,lineh))
        y+=lineh
    return {'image': image, 'bboxes': newbboxes} 
    #    return {'image': image, 'bboxes': [(15.22010770816713, 809.1400920373411, 2466.55127019975, 187.48281384441623),(22.94650927795794, 990.66322390377, 2460.420112757214, 165.13819865710272),(22.81244501708635, 1149.9251777029465, 2435.435716026433, 181.21025065469382)]}

def hardcoded_lines_fromcsv(image, bboxes, fname):
    # TODO Make this more efficient! eg read at start as a dictionary
    df = pd.read_csv('data/lines.csv', sep="\t")
    splitted = fname.split('/')[-1].split('_')
    idx = splitted[0]
    split = splitted[1]
    print(splitted)
    bboxes = []

    for i, row in df.iterrows():
        name = row['name'].split('_')
        if name[0] == '10003':
            print(name)
            print(name[2][:-4], split)
        if name[0] == idx and name[2] == split:
            bbox = literal_eval(row['crop_box'])
            x = bbox[0] * 2.5
            y = bbox[1] * 2.5
            w = (bbox[2] * 2.5) - x
            h = (bbox[3] * 2.5) - y
            bboxes.append((x,y,w,h))

    return {'image': image, 'bboxes': bboxes} 


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
    print(bboxes)
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
    return {'image': image, 'bboxes': bboxes, 'predicted_labels': [['Chien', 'Chat', 'Scorpion', 'Springbok', 'lion']] * len(bboxes)}


def classify_multilabel(image, bboxes):
    """Starts word Classification
    :param coordinates: Coordinates of user-corrected word boxes [(x, y, width, height),..]
    :return coordinates and list of word boxes [(x, y, width, height),..], [(x, y, width, height),..]
    """
    return {'image': image, 'bboxes': bboxes, 'predicted_labels' : [
        [ 'fly', 'blackbird', 'dove', 'ant', 'mosquito', 'lion' ],
        [ 'blackbird', 'dove', 'ant', 'mosquito', 'lion', 'fly' ],
        [ 'dove', 'ant', 'mosquito', 'lion', 'fly', 'blackbird' ],
        [ 'ant', 'mosquito', 'lion', 'fly', 'blackbird', 'dove' ],
        [ 'mosquito', 'lion', 'fly', 'blackbird', 'dove', 'ant' ],
        [ 'lion', 'fly', 'blackbird', 'dove', 'ant', 'mosquito' ],
        ]}


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

import Konva from 'konva'
import { automaton } from './start'
import { Data } from './data'
// import settings from './settings.json';
import animals from '../data/animals_fr.json'

declare var Split

export async function loadPicture() {
    console.log('loadpic')
    await $('.card-subtitle').hide()
    await $('#text-input').hide()
    await $('#word-list').hide()
    await $('.textContainer').hide()
    await $('.pictureContainer').show()
    await $('#pdf-meta').hide()
    await $('#pdf-contents').hide()
    await $('#picture_content').show()
    await $('.mainContainer').height('100%')
    await $('.gutter-vertical').remove()
    Split([ '#contentContainer', '#bottomContainer' ], {
        sizes: [ 90, 10 ],
        direction: 'vertical',
        gutterSize: 8,
        cursor: 'row-resize',
    })
    // await $('.contentContainer').height('80%')
    // await $('.bottomContainer').height('20%')
}

export async function loadPDF() {
    await $('.card-subtitle').hide()
    await $('#text-input').hide()
    await $('#word-list').hide()
    await $('.textContainer').hide()
    await $('.pictureContainer').show()
    await $('#pdf-meta').show()
    await $('#pdf-contents').show()
    await $('#picture_content').hide()
    await $('.context-content').hide()
    await $('.gutter-vertical').remove()
    Split([ '#contentContainer', '#bottomContainer' ], {
        sizes: [ 90, 10 ],
        direction: 'vertical',
        gutterSize: 8,
        cursor: 'row-resize',
    })
}

export async function loadWords() {
    await $('.card-subtitle').hide()
    await $('#text-input').show()
    await $('#word-list').show()
    await $('.textContainer').hide()
    await $('.pictureContainer').show()
    await $('#pdf-meta').hide()
    await $('#pdf-contents').hide()
    await $('#picture_content').show()
    // $('.contentContainer').height('80%')
    // $('.bottomContainer').height('20%')
}

//
/**
 * utility for flattening json of the form {"a": ["x"],"b":["z"], "c":["z"]} to unique ["x","z"]
 * @param grouped 
 */
function _flatten_grouped(grouped: Object): any[] {
    let element = []
    for (let group in grouped) {
        console.log(grouped[group])
        element = element.concat(grouped[group])
        var uniqueNames = []
        var obj = {}
        element = element.filter(function(item) {
            return obj.hasOwnProperty(item) ? false : (obj[item] = true)
        })
    }
    return element
}

export function showChooseWords(
    src,
    bboxs,
    predicted_words: string[][],
    question,
    answer?
) {
    if (!answer) {
        answer = 'Finish'
    }
    console.log(bboxs, question, answer)
    Data.annotations[Data.current_column] = {}

    Data.predicted_words = predicted_words
    predicted_words.forEach((element, index) => {
        Data.annotations[Data.current_column][index] = element[0]
    })
    drawImage(src).then(([ stage, layer, Kimage ]) => {
        onClickPictureWords(stage, layer, Kimage)

        const scaledbboxes = bboxs.map((bbox) => {
            return scaleFromDefault(new BBox(bbox))
        })
        Data.konvabboxes = []
        for (let bbox of scaledbboxes) {
            // console.log(bbox)
            var rect = new Konva.Rect({
                x: bbox.x,
                y: bbox.y,
                width: bbox.width,
                height: bbox.height,
                stroke: 'black',
                strokeWidth: 3,
                name: 'rect',
                // draggable: true
            })
            Data.konvabboxes.push(rect)
            layer.add(rect)
        }
        Data.konvabboxes[0].stroke('red')
        setupChooseWords(0)
        layer.draw()
        // add buttons
        $('#question').append(question)
    })
}

async function setupChooseWords(index) {
    // const animals = await import(settings.word_list_path);
    // const animals = await import('./data/animals_fr.json');
    // console.log(animals);
    let predicted: string[] = Data.predicted_words[index]

    Data.konvabboxes[index].stroke('red')

    // onclick to add active class to element when clicked
    var activeOnClick = function() {
        // console.log($(this));
        if ($(this).text() != '') {
            $('#input-item, .word-list-item').each(function() {
                $(this).removeClass('active')
            })
            $(this).addClass('active')
        }
    }

    var activateNext = function() {
        let index = 0
        let listitems = $('#input-item, .word-list-item:visible')
        listitems.each(function(i) {
            console.log($(this))
            if ($(this).hasClass('active')) {
                index = i
                $(this).removeClass('active')
            }
        })
        index = index > listitems.length - 2 ? 0 : index + 1
        $(listitems[index]).addClass('active').focus()
        console.log($(listitems[index]))
    }

    // shows filtered list
    var listController = function(animals_filtered) {
        $('.word-list-item, .word-list-item:hidden').each(function(index) {
            // console.log(index);
            // console.log($(this));
            let element =
                index > animals_filtered.length - 1
                    ? ''
                    : animals_filtered[index]
            if (element) {
                $(this).empty().show().append(element)
            } else {
                $(this).empty().hide()
            }
        })
    }

    // initial filter
    let animals_filtered = predicted //animals.slice(0, 10);

    // input filter
    $('#text-input').on('input', function() {
        let inp = <string>$(this).val()
        if (inp === '') {
            animals_filtered = predicted
        } else {
            animals_filtered = animals.filter((element) => {
                return element.toLowerCase().startsWith(inp.toLowerCase())
            })
            $('#input-item').empty().on('click', activeOnClick).append(inp)
        }
        console.log(animals_filtered)
        listController(animals_filtered)
        $('#input-item').trigger('click')
    })
    // build initial list
    $('#word-list').empty()
    $('#word-list').append(
        $(
            '<button id="input-item" class="list-group-item" style="text-align: left;"></button>'
        )
    )
    animals_filtered.forEach((animal, i) => {
        let item = $(
            '<button class="list-group-item word-list-item"></button>'
        )
            .on('click', activeOnClick)
            .append(animal)
        if (i === 0) item.addClass('active')
        $('#word-list').append(item)
    })

    $('#input-item, .word-list-item, #text-input').on('keydown', function(
        e
    ) {
        if (
            ($(this).val() != '' || $(this).text() != '') &&
            e.key === 'Tab'
        ) {
            // $('#input-item').click();
            e.preventDefault()
            // console.log(e);
            activateNext()
        }
    })

    $('#input-item, .word-list-item, #text-input').on('keydown', function(
        e
    ) {
        console.log(e.key)
        if (
            ($(this).val() != '' || $(this).text() != '') &&
            e.key === 'Tab'
        ) {
            // $('#input-item').click();
            e.preventDefault()
            // activateNext();
        }
    })

    let yes = $('<button class="btn btn-primary"></button>')

    if (index < Data.predicted_words.length - 1) {
        yes.append('Next')
        yes.on('click', () => {
            $('#input-item, .word-list-item').each(function() {
                if ($(this).hasClass('active')) {
                    Data.annotations[Data.current_column][index] = $(
                        this
                    ).text()
                    $(this).removeClass('active')
                    return false
                }
            })
            Data.konvabboxes[index].stroke('green')
            Data.konvabboxes[index].parent.draw()
            setupChooseWords(index + 1)
        })
    } else {
        yes.append('Finish')
        yes.on('click', () =>
            automaton.next('NEXT', {
                words: Data.annotations[Data.current_column],
            })
        )
    }
    listAnnotated()
    $('#answer').empty().append(yes)
}

function listAnnotated() {
    // for (let i in Data.annotations[Data.current_column]) {
    // 	$('.bottomContainer').append(
    // 		'<button>' + Data.annotations[Data.current_column][i] + '</button> '
    // 	);
    // 	console.log(Data.annotations[Data.current_column][i]);
    // }
}

export function showAnnotatePicture(src, bboxs, question, answer) {
    console.log(bboxs)
    drawImage(src).then(([ stage, layer, Kimage ]) => {
        onClickPicture(stage, layer, Kimage)
        const scaledbboxes = bboxs.map((bbox) => {
            return scaleFromDefault(new BBox(bbox))
        })
        Data.konvabboxes = []
        for (let bbox of scaledbboxes) {
            // console.log(bbox)
            const rect = new Konva.Rect({
                x: bbox.x,
                y: bbox.y,
                width: bbox.width,
                height: bbox.height,
                stroke: 'red',
                strokeWidth: 3,
                name: 'rect',
                draggable: true,
            })

            Data.konvabboxes.push(rect)
            layer.add(rect)
            layer.draw()
        }
        // add buttons
        $('#question').append(question)
        let yes = $('<button class="btn btn-primary"></button>')
        yes.append(answer)
        yes.on('click', () => {
            const scaledbboxes = extractBboxes(layer).map((bbox) => {
                return scaleToDefault(new BBox(bbox)).toArray()
            })
            automaton.next('NEXT', { bboxes: scaledbboxes })
        })
        $('#answer').append(yes)
    })
}

/**
 * Draw Image to a {Konva.Stage}
 * @param {string} src Source URL for image
 */
function drawImage(src) {
    return new Promise((resolve, reject) => {
        let image = new Image()
        image.onload = () => {
            // make image fit into picture_content

            let scale = $('#picture_content').width() / image.width
            if (scale * image.height > $('#picture_content').height()) {
                scale = $('#picture_content').height() / image.height
                image.width = scale * image.width
                image.height = $('#picture_content').height()
            } else {
                image.width = $('#picture_content').width()
                image.height = scale * image.height
            }
            // set global scales to standardize bboxes
            Data.scales.x = 2500 / image.width
            Data.scales.y = 2500 / image.height

            // setup stage with previously calculated scaling
            var stage = new Konva.Stage({
                container: 'picture_content',
                width: image.width,
                height: image.height,
            })
            $('.konvajs-content')[0].style['box-shadow'] =
                '-3px 5px 9px 0px grey'
            var layer = new Konva.Layer()
            stage.add(layer)
            // add picture
            let Kimage = new Konva.Image({
                x: 0,
                y: 0,
                image: image,
                width: image.width,
                height: image.height,
            })
            // add picture to layer
            layer.add(Kimage)
            layer.draw()
            // set onclickmethod
            // onClickPicture(stage, layer, Kimage);
            // onClickPictureWords(stage, layer, Kimage);
            resolve([ stage, layer, Kimage ])
        }
        // image.src = URL + '/api/getpicture';
        // load image
        image.src = src
    })
}

/**
 * set onclick method for stage to:
 * 1. if Rect: add transformer to rect
 * 2. if not rect: deactivate transformer
 * 3. if not rect and no transformer: add new
 * 4. if transformer also set onkeylistener for backspace
 * @param {Konva.Stage} stage 
 */
function onClickPicture(stage, layer, Kimage) {
    stage.off('click tap')
    stage.on('click tap', function(e) {
        // if click on empty area - remove all transformers
        // console.log(e)
        if (e.target === Kimage) {
            if (stage.find('Transformer').length != 0) {
                // console.log('redraw')
                // console.log(extractBboxes(layer))
                redrawBoxes(layer, extractBboxes(layer))
                // stage.find('Transformer').destroy();
                // layer.draw();
                return
            } else {
                let rect = new Konva.Rect({
                    x: e.evt.layerX,
                    y: e.evt.layerY,
                    width: 100,
                    height: 50,
                    stroke: 'red',
                    strokeWidth: 3,
                    name: 'rect',
                    draggable: true,
                })

                layer.add(rect)
                layer.draw()
                return
            }
        }
        // do nothing if clicked NOT on our rectangles
        if (!e.target.hasName('rect')) {
            return
        }
        // remove old transformers
        // TODO: we can skip it if current rect is already selected
        stage.find('Transformer').destroy()

        // create new transformer
        var tr = new Konva.Transformer({
            rotateEnabled: false,
            borderDash: [ 4, 4 ],
            keepRatio: false,
            borderStrokeWidth: 3,
            borderStroke: 'green',
            anchorSize: 5,
        })
        layer.add(tr)
        tr.attachTo(e.target)
        layer.draw()
        document.onkeydown = (keyev) => {
            if (keyev.key == 'r') {
                e.target.destroy()
                stage.find('Transformer').destroy()
                layer.draw()
            }
        }
    })
}

/**
 * 
 * @param stage 
 * @param layer 
 * @param Kimage 
 */
function onClickPictureWords(stage, layer, Kimage) {
    stage.off('click tap')
    stage.on('click tap', function(e) {
        if (!e.target.hasName('rect')) {
            return
        }
        Data.konvabboxes.forEach((bbox) => {
            if (bbox.attrs.stroke != 'green') {
                bbox.stroke('black')
            }
        })
        e.target.stroke('red')
        layer.draw()
        setupChooseWords(Data.konvabboxes.indexOf(e.target))
        window['clicked'] = e.target
        window['stage'] = stage
        window['layer'] = layer
    })
}

/**
 * extract bbox 
 * @param {Konva.Layer} layer 
 */
function extractBboxes(layer) {
    console.log(layer.find('.rect'))
    window['layer'] = layer
    let bboxes = []
    for (let rect of layer.find('.rect')) {
        let scalex = rect.attrs.scaleX ? rect.attrs.scaleX : 1
        let scaley = rect.attrs.scaleY ? rect.attrs.scaleY : 1
        // let bbox = {
        // 	x: rect.attrs.x,
        // 	y: rect.attrs.y,
        // 	width: rect.attrs.width * scalex,
        // 	height: rect.attrs.height * scaley
        // };
        let bbox = [
            rect.attrs.x,
            rect.attrs.y,
            rect.attrs.width * scalex,
            rect.attrs.height * scaley,
        ]
        bboxes.push(bbox)
    }
    // layer.destroyChildren()
    // // layer.find('.rect').destroy()
    // // layer.find('Transformer').destroy()
    // layer.draw()

    return bboxes
}

/**
 * Redraw Boxes in a Konva Layer e.g. when they were transformed by Transformer
 * @param {Konva.Layer} layer 
 * @param {Array<float>} bboxes (x,y,width,height)
 */
function redrawBoxes(layer, bboxes) {
    layer.find('.rect').destroy()
    layer.find('Transformer').destroy()
    layer.draw()
    // console.log(bboxes)
    for (let bbox of bboxes) {
        const rect = {
            stroke: 'red',
            strokeWidth: 3,
            name: 'rect',
            draggable: true,
        }
        bbox = {
            x: bbox[0],
            y: bbox[1],
            width: bbox[2],
            height: bbox[3],
        }
        const krect = new Konva.Rect(Object.assign(rect, bbox))
        // console.log(rect)
        layer.add(krect)
    }
    // console.log(layer)
    layer.draw()
}

/**
 * scales bbox values
 * @param {int} scale 
 * @param {Array<float>} bboxes 
 */
function scaleToDefault(bbox: BBox): BBox {
    bbox.x = bbox.x * Data.scales.x
    bbox.width = bbox.width * Data.scales.x
    bbox.y = bbox.y * Data.scales.y
    bbox.height = bbox.height * Data.scales.y
    return bbox
}

/**
 * scales bbox values
 * @param {int} scale 
 * @param {Array<float>} bboxes 
 */
function scaleFromDefault(bbox): BBox {
    bbox.x = bbox.x / Data.scales.x
    bbox.width = bbox.width / Data.scales.x
    bbox.y = bbox.y / Data.scales.y
    bbox.height = bbox.height / Data.scales.y
    return bbox
}

interface BBoxI {
    x: number
    y: number
    width: number
    height: number
}

class BBox implements BBoxI {
    x: number
    y: number
    width: number
    height: number
    constructor(bbox: number[]) {
        this.x = bbox[0]
        this.y = bbox[1]
        this.width = bbox[2]
        this.height = bbox[3]
    }
    toArray() {
        return [ this.x, this.y, this.width, this.height ]
    }
}

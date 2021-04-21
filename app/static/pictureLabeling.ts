import Konva from 'konva'
import { automaton } from './start'
import { Data } from './data'
// import settings from './settings.json';
import autocomplete_list from '../data/autocomplete.json'

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
        const uniqueNames = []
        const obj = {}
        element = element.filter(function(item) {
            return obj.hasOwnProperty(item) ? false : (obj[item] = true)
        })
    }
    return element
}

export function showLabelBBoxes(
    src: string,
    bboxs: number[][],
    predicted_labels: string[][],
    question: string,
    answer?: string
) {
    if (!answer) {
        answer = 'Finish'
    }
    Data.annotations[Data.current_column] = {}

    Data.predicted_labels = predicted_labels
    predicted_labels.forEach((element, index) => {
        Data.annotations[Data.current_column][index] = element[0]
    })
    drawImage(src).then(([ stage, layer, Kimage ]) => {
        onClickPictureWords(stage, layer)

        const scaledbboxes = bboxs.map((bbox) => {
            return new BBox(bbox).scaleFromDefault()
        })
        Data.guiBBoxes = []
        for (let bbox of scaledbboxes) {
            // console.log(bbox)
            const rect = new Konva.Rect({
                x: bbox.x,
                y: bbox.y,
                width: bbox.width,
                height: bbox.height,
                stroke: 'black',
                strokeWidth: 3,
                name: 'rect',
                // draggable: true
            })
            const guiBBox = new GuiBBox(rect, false)
            Data.guiBBoxes.push(guiBBox)
            layer.add(rect)
        }
        setupLabelBBoxes(0)
        layer.draw()
        // add buttons
        $('#question').append(question)
    })
}

async function setupLabelBBoxes(index) {
    let predicted: string[] = Data.predicted_labels[index]

    Data.guiBBoxes[index].guiBox.stroke('red')
    Data.guiBBoxes[index].guiBox.parent.draw()

    setupAutocompleteList(predicted)

    let yes = $('<button class="btn btn-primary"></button>')

    if (index < Data.predicted_labels.length - 1) {
        yes.append('Next')
        yes.on('click', () => {
            yes.off('click')
            $('#input-item, .word-list-item').each(function() {
                if ($(this).hasClass('active')) {
                    Data.annotations[Data.current_column][index] = $(
                        this
                    ).text()
                    $(this).removeClass('active')
                    return false
                }
            })
            Data.guiBBoxes[index].annotated = true
            Data.guiBBoxes[index].guiBox.stroke('green')
            Data.guiBBoxes[index].guiBox.parent.draw()
            setupLabelBBoxes(index + 1)
        })
    } else {
        yes.append('Finish')
        yes.on('click', () =>
            automaton.next('NEXT', {
                labels: Data.annotations[Data.current_column],
            })
        )
    }
    listAnnotated()
    $('#answer').empty().append(yes)
}

function setupAutocompleteList(prediction: string[]) {
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
        index = index >= listitems.length - 1 ? 0 : index + 1 // if larger than list reset to 1
        $(listitems[index]).addClass('active').trigger('focus')
        console.log($(listitems[index]))
    }

    // shows filtered list
    var listController = function(autocomplete_filtered) {
        $('.word-list-item, .word-list-item:hidden').each(function(index) {
            let element =
                index > autocomplete_filtered.length - 1
                    ? ''
                    : autocomplete_filtered[index]
            if (element) {
                $(this).empty().show().append(element)
            } else {
                $(this).empty().hide()
            }
        })
    }

    // initial filter
    let autocomplete_list_filtered = prediction

    // input filter
    $('#text-input').off('input').on('input', function() {
        let inp = <string>$(this).val()
        if (inp === '') {
            autocomplete_list_filtered = prediction
            $('#input-item')
                .empty()
                .on('click', activeOnClick)
                .append('/empty/')
            console.log('empty')
        } else {
            autocomplete_list_filtered = autocomplete_list.filter(
                (element) => {
                    return element
                        .toLowerCase()
                        .startsWith(inp.toLowerCase())
                }
            )
            $('#input-item').empty().on('click', activeOnClick).append(inp)
        }
        console.log(autocomplete_list_filtered)
        listController(autocomplete_list_filtered)
        $('#input-item').trigger('click')
    })

    // build initial list
    $('#word-list').empty()
    $('#word-list').append(
        $(
            '<button id="input-item" class="list-group-item" style="text-align: left;"></button>'
        ).addClass('active')
    )
    for (let i = 0; i < 9; i++) {
        if (i != 0) {
            let item = $(
                '<button class="list-group-item word-list-item"></button>'
            ).on('click', activeOnClick)
            if (i < autocomplete_list_filtered.length) {
                item.append(autocomplete_list_filtered[i])
            }
            // item.addClass('active')
            $('#word-list').append(item)
        }
    }

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
    $('#text-input').val(prediction[0])
    $('#input-item').text(prediction[0])
}

function listAnnotated() {
    console.log('list annotated')
    console.log(Data.annotations[Data.current_column])
    Data.predicted_labels = [
        [ 'fly', 'blackbird', 'dove', 'ant', 'mosquito', 'lion' ],
    ]

    const predictionContainer = $('<div style="display: flex"></div>')
    $('.bottomContainer').append(predictionContainer)
    predictionContainer.append('<span>+</span>')

    for (let i = 0; i < Data.predicted_labels.length; i++) {
        predictionContainer.append(
            '<span>' + Data.predicted_labels[i][0] + '</span>'
        )
        if (i < Data.predicted_labels.length - 2) {
            predictionContainer.append(
                '<span data-toggle="tooltip" data-placement="top" title="+" style="min-width: 5px"></span>'
            )
        }
        // console.log(Data.predicted_labels[i])
    }
    predictionContainer.append('<span>+</span>')
    // $('[data-toggle="tooltip"]').tooltip()
    predictionContainer.tooltip()
}

export function showMultilabelBBox(
    src: string,
    bbox: number[],
    predicted_labels: string[][],
    question: string,
    answer?: string
) {
    if (!answer) {
        answer = 'Finish'
    }
    Data.annotations[Data.current_column] = {}

    Data.predicted_labels = predicted_labels
    predicted_labels.forEach((element, index) => {
        Data.annotations[Data.current_column][index] = element[0]
    })
    // DEBUG
    Data.predicted_labels = [
        [ 'fly', 'blackbird', 'dove', 'ant', 'mosquito', 'lion' ],
        [ 'blackbird', 'dove', 'ant', 'mosquito', 'lion', 'fly' ],
        [ 'dove', 'ant', 'mosquito', 'lion', 'fly', 'blackbird' ],
        [ 'ant', 'mosquito', 'lion', 'fly', 'blackbird', 'dove' ],
        [ 'mosquito', 'lion', 'fly', 'blackbird', 'dove', 'ant' ],
        [ 'lion', 'fly', 'blackbird', 'dove', 'ant', 'mosquito' ],
    ]
    predicted_labels = Data.predicted_labels
    drawImage(src).then(([ stage, layer, Kimage ]) => {
        onClickPictureWords(stage, layer)
        const scaledBBox = new BBox(bbox).scaleFromDefault()
        Data.guiBBoxes = []
        const rect = new Konva.Rect({
            x: scaledBBox.x,
            y: scaledBBox.y,
            width: scaledBBox.width,
            height: scaledBBox.height,
            stroke: 'black',
            strokeWidth: 3,
            name: 'rect',
            // draggable: true
        })

        const guiBBox = new GuiBBox(rect, false)
        Data.guiBBoxes.push(guiBBox)
        layer.add(rect)

        // Data.guiBBoxes[0].guiBox.stroke('red')
        const labels = drawBBoxLabels(
            stage,
            layer,
            scaledBBox,
            predicted_labels
        )
        listAnnotated()

        setupMultilabelBBox(0, labels)
        setupAutocompleteList(predicted_labels[0])

        // layer.draw()
        // add buttons
        $('#question').append(question)

        let yes = $('<button class="btn btn-primary"></button>')
        yes.append(answer).on('click', () => {
            console.log('bla')
            console.log(predicted_labels)
            predicted_labels.push([ 'test', 'testrow' ])
            const labels = drawBBoxLabels(
                stage,
                layer,
                scaledBBox,
                predicted_labels
            )
            setupMultilabelBBox(0, labels)
        })
        $('#answer').empty().append(yes)
    })
}
/**
 * 
 * @param stage 
 * @param layer 
 * @param scaledBBox 
 * @param predicted_labels 
 */
function drawBBoxLabels(
    stage: Konva.Stage,
    layer: Konva.Layer,
    scaledBBox,
    predicted_labels: string[][]
) {
    stage.find('Text').each((child) => child.destroy())

    let offset = scaledBBox.x
    const labels = []
    for (let i = 0; i < predicted_labels.length; i++) {
        const fontSize = 16
        const text = new Konva.Text({
            x: offset,
            y: scaledBBox.y - fontSize - 2,
            align: 'center',
            fontSize: fontSize,
            wrap: 'word',
            // height
            text: predicted_labels[i][0],
        })

        console.log(predicted_labels[i])
        const textborder = new Konva.Rect({
            x: offset - 2,
            y: text.y(),
            width: text.width() + 4,
            height: text.height(),
            stroke: '#555',
            strokeWidth: 1,
            fill: '#ddd',
            cornerRadius: 3,
        })

        // TODO: full length of box?
        offset = text.x() + text.width() + 6

        layer.add(textborder)
        layer.add(text)
        labels.push(text)
        // DEBUG
        window['ktext' + i] = text
    }
    stage.off('click')
    stage.on('click', (e) => {
        const index = labels.indexOf(e.target)
        if (index != -1) {
            console.log('clicked box')
            console.log(index)
            setupMultilabelBBox(index, labels)
            setupAutocompleteList(predicted_labels[index])
        }
    })
    layer.draw()

    return labels
}

function setupMultilabelBBox(index: number, labels: Konva.Text[]) {
    // set label colors in Image
    for (let i = 0; i < labels.length; i++) {
        if (i === index) {
            labels[i].fill('red').draw()
        } else {
            labels[i].fill('black').draw()
        }
        $('#text-input').trigger('focus')
    }
    // TODO: set label colors at bottom

    // TODO: setup suggestions in the right panel
}

function setupSuggestions() {}

export function showAnnotatePicture(
    src: string,
    bboxs: number[][],
    question: string,
    answer: string
) {
    console.log(bboxs)
    drawImage(src).then(([ stage, layer, Kimage ]) => {
        onClickPicture(stage, layer, Kimage)
        const scaledbboxes = bboxs.map((bbox) => {
            return new BBox(bbox).scaleFromDefault()
        })
        Data.guiBBoxes = []
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

            const guiBox = new GuiBBox(rect, false)
            Data.guiBBoxes.push(guiBox)
            layer.add(rect)
            layer.draw()
        }
        // add buttons
        $('#question').append(question)
        let yes = $('<button class="btn btn-primary"></button>')
        yes.append(answer)
        yes.on('click', () => {
            yes.off('click')
            const scaledbboxes = extractBBoxes(layer).map((bbox) => {
                return bbox.scaleToDefault().toArray()
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
function drawImage(
    src: string
): Promise<[Konva.Stage, Konva.Layer, Konva.Image]> {
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
            const stage = new Konva.Stage({
                container: 'picture_content',
                width: image.width,
                height: image.height,
            })
            $('.konvajs-content')[0].style['box-shadow'] =
                '-3px 5px 9px 0px grey'
            const layer = new Konva.Layer()
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
                // console.log(extractBBoxes(layer))
                redrawBoxes(layer, extractBBoxes(layer))
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
        const tr = new Konva.Transformer({
            rotateEnabled: false,
            borderDash: [ 4, 4 ],
            keepRatio: false,
            ignoreStroke: true,
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
function onClickPictureWords(stage, layer) {
    stage.off('click tap')
    stage.on('click tap', function(e) {
        if (!e.target.hasName('rect')) {
            return
        }
        Data.guiBBoxes.forEach((bbox) => {
            if (bbox.annotated) {
                bbox.guiBox.stroke('green')
            } else {
                bbox.guiBox.stroke('black')
            }
        })
        e.target.stroke('red')
        layer.draw()
        setupLabelBBoxes(
            Data.guiBBoxes
                .map((element) => {
                    return element.guiBox
                })
                .indexOf(e.target)
        )
        window['clicked'] = e.target
        window['stage'] = stage
        window['layer'] = layer
    })
}

/**
 * extract konva rectangles from layer
 * @param {Konva.Layer} layer 
 */
function extractBBoxes(layer): BBox[] {
    // console.log(layer.find('.rect'))
    // window['layer'] = layer
    let bboxes = []
    for (let rect of layer.find('.rect')) {
        // scaling of konva object is saved in rect.attrs.scaleX/Y
        const scalex = rect.attrs.scaleX ? rect.attrs.scaleX : 1
        const scaley = rect.attrs.scaleY ? rect.attrs.scaleY : 1
        // apply Konva scale to width and height
        const bbox = [
            rect.attrs.x,
            rect.attrs.y,
            rect.attrs.width * scalex,
            rect.attrs.height * scaley,
        ]
        bboxes.push(new BBox(bbox))
    }
    return bboxes
}

/**
 * Redraw Boxes in a Konva Layer e.g. when they were transformed by Transformer
 * @param {Konva.Layer} layer 
 * @param {Array<float>} bboxes (x,y,width,height)
 */
function redrawBoxes(layer, bboxes: BBox[]): void {
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
        const krect = new Konva.Rect(Object.assign(rect, bbox))
        layer.add(krect)
    }
    layer.draw()
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
    toArray(): number[] {
        return [ this.x, this.y, this.width, this.height ]
    }
    scaleFromDefault(): BBox {
        console.log(this)
        this.x = this.x / Data.scales.x
        this.width = this.width / Data.scales.x
        this.y = this.y / Data.scales.y
        this.height = this.height / Data.scales.y
        console.log(this)
        return this
    }
    scaleToDefault(): BBox {
        this.x = this.x * Data.scales.x
        this.width = this.width * Data.scales.x
        this.y = this.y * Data.scales.y
        this.height = this.height * Data.scales.y
        return this
    }
}

class GuiBBox {
    guiBox: Konva.Rect
    annotated: boolean
    constructor(konvaBox: Konva.Rect, annotated: boolean) {
        this.guiBox = konvaBox
        this.annotated = annotated
    }
}

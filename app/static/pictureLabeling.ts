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
    src: string,
    bboxs: number[][],
    predicted_words: string[][],
    question: string,
    answer?: string
) {
    if (!answer) {
        answer = 'Finish'
    }
    Data.annotations[Data.current_column] = {}

    Data.predicted_words = predicted_words
    predicted_words.forEach((element, index) => {
        Data.annotations[Data.current_column][index] = element[0]
    })
    drawImage(src).then(([ stage, layer, Kimage ]) => {
        onClickPictureWords(stage, layer)

        const scaledbboxes = bboxs.map((bbox) => {
            return new BBox(bbox).scaleFromDefault()
        })
        Data.guiBboxes = []
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
            var guiBbox = new GuiBBox(rect, false)
            Data.guiBboxes.push(guiBbox)
            layer.add(rect)
        }
        Data.guiBboxes[0].guiBox.stroke('red')
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

    Data.guiBboxes[index].guiBox.stroke('red')
    Data.guiBboxes[index].guiBox.parent.draw()

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
        $(listitems[index]).addClass('active').trigger('focus')
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
            Data.guiBboxes[index].annotated = true
            Data.guiBboxes[index].guiBox.stroke('green')
            Data.guiBboxes[index].guiBox.parent.draw()
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
        Data.guiBboxes = []
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

            var guiBox = new GuiBBox(rect, false)
            Data.guiBboxes.push(guiBox)
            layer.add(rect)
            layer.draw()
        }
        // add buttons
        $('#question').append(question)
        let yes = $('<button class="btn btn-primary"></button>')
        yes.append(answer)
        yes.on('click', () => {
            yes.off('click')
            const scaledbboxes = extractBboxes(layer).map((bbox) => {
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
function drawImage(src: string) {
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
function onClickPictureWords(stage, layer) {
    stage.off('click tap')
    stage.on('click tap', function(e) {
        if (!e.target.hasName('rect')) {
            return
        }
        Data.guiBboxes.forEach((bbox) => {
            if (bbox.annotated) {
                bbox.guiBox.stroke('green')
            } else {
                bbox.guiBox.stroke('black')
            }
        })
        e.target.stroke('red')
        layer.draw()
        setupChooseWords(Data.guiBboxes.map((element) => {return element.guiBox}).indexOf(e.target))
        window['clicked'] = e.target
        window['stage'] = stage
        window['layer'] = layer
    })
}

/**
 * extract konva rectangles from layer
 * @param {Konva.Layer} layer 
 */
function extractBboxes(layer): BBox[] {
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
        this.x = this.x / Data.scales.x
        this.width = this.width / Data.scales.x
        this.y = this.y / Data.scales.y
        this.height = this.height / Data.scales.y
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

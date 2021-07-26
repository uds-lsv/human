import Konva from 'konva'
import { automaton } from './start'
import { Data } from './data'
// import settings from './settings.json';
import autocomplete_list from '../data/autocomplete.json'
import { FZF } from './fuzzy'

declare var Split

export async function loadPicture() {
    console.log('loadpic')
    await Promise.all([
        $('.card-subtitle').hide(),
        $('#text-input').hide(),
        $('#text-input-group').hide(),
        $('#word-list').hide(),
        $('.textContainer').hide(),
        $('.pictureContainer').show(),
        $('#pdf-meta').hide(),
        $('#pdf-contents').hide(),
        $('#picture_content').show(),
        $('.mainContainer').height('100%'),
        $('.gutter-vertical').remove(),
        // await $('.contentContainer').height('80%')
        // await $('.bottomContainer').height('20%')
    ])
    Split([ '#contentContainer', '#bottomContainer' ], {
        sizes: [ 90, 10 ],
        direction: 'vertical',
        gutterSize: 8,
        cursor: 'row-resize',
    })
}

export async function loadPDF() {
    await Promise.all([
        $('.card-subtitle').hide(),
        $('#text-input').hide(),
        $('#text-input-group').hide(),
        $('#word-list').hide(),
        $('.textContainer').hide(),
        $('.pictureContainer').show(),
        $('#pdf-meta').show(),
        $('#pdf-contents').show(),
        $('#picture_content').hide(),
        $('.context-content').hide(),
        $('.gutter-vertical').remove(),
    ])
    Split([ '#contentContainer', '#bottomContainer' ], {
        sizes: [ 90, 10 ],
        direction: 'vertical',
        gutterSize: 8,
        cursor: 'row-resize',
    })
}

export async function loadWords() {
    await Promise.all([
        $('.card-subtitle').hide(),
        $('#text-input').show(),
        $('#text-input-group').show(),
        $('#word-list').show(),
        $('.textContainer').hide(),
        $('.pictureContainer').show(),
        $('#pdf-meta').hide(),
        $('#pdf-contents').hide(),
        $('#picture_content').show(),
        $('.gutter-vertical').remove(), // remove gutter to add it later again
        $('#fzf-toggle').addClass('active'),
    ])
    Split([ '#contentContainer', '#bottomContainer' ], {
        sizes: [ 90, 10 ],
        direction: 'vertical',
        gutterSize: 8,
        cursor: 'row-resize',
    })
}

/**
 * UNUSED
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

    const annotations = []
    Data.predicted_labels = predicted_labels
    predicted_labels.forEach((element, index) => {
        annotations.push([ element[0], element[0] ])
    })
    drawImage(src).then(([ stage, layer, Kimage ]) => {
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
        const labelBBoxTask = new LabelBBoxTask(
            predicted_labels,
            annotations,
            Data.guiBBoxes,
            layer,
            stage
        )
        labelBBoxTask.setCurrentIndex(0)
        labelBBoxTask.onClickPictureWords(stage, layer)

        layer.draw()
        // add buttons
        $('#question').append(question)
    })
}

function setupAutocompleteList(prediction: string[], task: ITask) {
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

    var activatePrev = function() {
        let listitems = $('#input-item, .word-list-item:visible')
        let index = listitems.length - 1
        listitems.each(function(i) {
            if ($(this).hasClass('active')) {
                index = i
                $(this).removeClass('active')
                if (index <= 0) {
                    index = listitems.length - 1
                    while ($(listitems[index]).text() == '' && index > 0) {
                        index = index - 1
                    }
                } else {
                    index = index - 1
                }
                return false
            }
        })
        $(listitems[index]).addClass('active').trigger('focus')
    }
    var activateNext = function() {
        let index = 0
        let listitems = $('#input-item, .word-list-item:visible')
        listitems.each(function(i) {
            if ($(this).hasClass('active')) {
                index = i
                $(this).removeClass('active')
                if (
                    index >= listitems.length - 1 ||
                    (index < listitems.length - 1 &&
                        $(listitems[i + 1]).text() == '')
                ) {
                    index = 0
                } else {
                    index = index + 1
                }
                return false
            }
        })

        $(listitems[index]).addClass('active').trigger('focus')
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
        if (inp.trim() === '') {
            autocomplete_list_filtered = prediction
            $('#input-item')
                .empty()
                .on('click', activeOnClick)
                .append('/empty/')
        } else {
            // search fuzzy if toggle is on
            if ($('#fzf-toggle').hasClass('active')) {
                autocomplete_list_filtered = FZF.fzf_sort(
                    inp.toLowerCase(),
                    autocomplete_list
                ).map((el) => el.string)
            } else {
                autocomplete_list_filtered = autocomplete_list.filter(
                    (element) => {
                        return element
                            .toLowerCase()
                            .startsWith(inp.toLowerCase())
                    }
                )
            }
            $('#input-item').empty().on('click', activeOnClick).append(inp)
        }
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

    $('#input-item, .word-list-item, #text-input')
        .off('keyup')
        .on('keyup', function(e) {
            if (e.shiftKey && e.key === 'Enter') {
                // $('#input-item').click();
                e.preventDefault()
                setAnnotation(task)
                task.setCurrentIndex(
                    task.currentIndex === 0 ? 0 : task.currentIndex - 1
                )
            } else if (e.key === 'Enter') {
                // $('#input-item').click();
                e.preventDefault()
                setAnnotation(task)
                task.setCurrentIndex(task.currentIndex + 1)
            }
        })
    $('#input-item, .word-list-item, #text-input')
        .off('keydown')
        .on('keydown', function(e) {
            if ((e.shiftKey && e.key === 'Tab') || e.key === 'ArrowUp') {
                e.preventDefault()
                activatePrev()
            } else if (e.key === 'Tab' || e.key === 'ArrowDown') {
                e.preventDefault()
                activateNext()
            }
        })
    $('#text-input').val(prediction[0])
    $('#text-input').trigger('select')
    $('#input-item').text(prediction[0])
}

// TODO refactor this and probably better transform into superclass method
function setAnnotation(task: ITask) {
    let listitems = $('#input-item, .word-list-item:visible')
    listitems.each(function(i) {
        if ($(this).hasClass('active')) {
            task.annotations[task.currentIndex][0] = $(this).text()
            task.predicted_labels[task.currentIndex][0] = $(this).text()
            return false
        }
    })
    task.drawBBoxLabels()
    // task.setCurrentIndex(task.currentIndex + 1)
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
    const annotations = []

    Data.predicted_labels = predicted_labels
    predicted_labels.forEach((element, index) => {
        annotations.push([ element[0], element[0] ])
    })
    // draw image in background layer
    MultilabelBBoxTask.drawImage(src).then(([ stage, layer, Kimage ]) => {
        // add bounding box to background layer
        const scaledBBox = new BBox(bbox).scaleFromDefault()
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
        layer.add(rect)
        layer.draw()

        // new layer for badges
        const badgeLayer = new Konva.Layer()
        stage.add(badgeLayer)
        // instantiate task
        const multilabelBBoxTask = new MultilabelBBoxTask(
            predicted_labels,
            annotations,
            scaledBBox,
            badgeLayer,
            stage
        )
        multilabelBBoxTask.drawBBoxLabels()
        multilabelBBoxTask.setCurrentIndex(0)
        setupAutocompleteList(predicted_labels[0], multilabelBBoxTask)

        // controls in bottom container
        const buttonContainer = $('<div style="display: flex"></div>')
        $('.bottomContainer').append(buttonContainer)
        buttonContainer.append(
            $(
                '<button class="btn btn-primary">< +</button>'
            ).on('click', () => {
                multilabelBBoxTask.insertLabel(
                    multilabelBBoxTask.currentIndex
                )
            })
        )
        buttonContainer.append(
            $(
                '<button class="btn btn-primary">+ ></button>'
            ).on('click', () => {
                multilabelBBoxTask.insertLabel(
                    multilabelBBoxTask.currentIndex + 1
                )
            })
        )

        // controls in right side container
        $('#question').append(question)

        let yes = $('<button class="btn btn-primary"></button>')
        yes.append(answer)
        yes.on('click', () => {
            yes.off('click')
            setAnnotation(multilabelBBoxTask)
            buttonContainer.remove()
            automaton.next('NEXT', {
                labels: multilabelBBoxTask.annotations,
            })
        })
        $('#answer').empty().append(yes)

        if (Data.active >= 1) {
            let back = $('<button class="btn btn-primary"></button>')
            back.append('Go back')
            back.on('click', () => {
                back.off('click')
                setAnnotation(multilabelBBoxTask)
                buttonContainer.remove()
                Data.active -= 2
                automaton.next('NEXT', {
                    labels: multilabelBBoxTask.annotations,
                })
            })
            $('#answer').prepend(back)
        }
    })
}

function setupSuggestions() {}

export function showPictureBBox(
    src: string,
    bboxs: number[][],
    active: number
) {
    console.log(bboxs)
    drawImage(src).then(([ stage, layer, Kimage ]) => {
        const scaledbboxes = bboxs.map((bbox) => {
            return new BBox(bbox).scaleFromDefault()
        })
        Data.guiBBoxes = []
        for (let i = 0; i < scaledbboxes.length; i++) {
            const bbox = scaledbboxes[i]
            // console.log(bbox)
            const rect = new Konva.Rect({
                x: bbox.x,
                y: bbox.y,
                width: bbox.width,
                height: bbox.height,
                stroke: i == active ? 'red' : 'black',
                strokeWidth: 3,
                name: 'rect',
            }).on('click', (e) => {
                layer.children.each((child) => {
                    if (e.target == child) {
                        child.setAttr('stroke', 'red')
                    } else {
                        child.setAttr('stroke', 'black')
                    }
                })
                layer.draw()
            })

            const guiBox = new GuiBBox(rect, false)
            Data.guiBBoxes.push(guiBox)
            layer.add(rect)
            layer.draw()
        }
    })
}

export function showAnnotatePicture(
    src: string,
    bboxs: number[][],
    question: string,
    answer: string,
    max_bboxes: number = null
) {
    console.log(bboxs)
    drawImage(src).then(([ stage, layer, Kimage ]) => {
        onClickPicture(stage, layer, Kimage, max_bboxes)
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
            rescaleGuiBBoxes()
            const scaledbboxes = extractBBoxes(layer)
                .sort(BBox.sortBBoxArray)
                .map((bbox) => {
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
function onClickPicture(
    stage,
    layer: Konva.Layer,
    Kimage,
    max_bboxes = null
) {
    stage.off('click tap')
    stage.on('click tap', function(e) {
        // if click on empty area - remove all transformers
        // console.log(e)
        if (e.target === Kimage) {
            if (stage.find('Transformer').length != 0) {
                // console.log('redraw')
                // console.log(extractBBoxes(layer))
                redrawBoxes(layer, extractBBoxes(layer))
                rescaleGuiBBoxes()
                // stage.find('Transformer').destroy();
                // layer.draw();
                return
            } else {
                if (
                    max_bboxes &&
                    layer.getChildren().length >= max_bboxes
                ) {
                    return
                }
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
                Data.guiBBoxes.push(new GuiBBox(rect, false))
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
            enabledAnchors: [
                'top-left',
                'top-right',
                'bottom-left',
                'bottom-right',
            ],
        })
        layer.add(tr)
        tr.attachTo(e.target)
        layer.draw()
        document.onkeydown = (keyev) => {
            if (keyev.key == 'r') {
                Data.guiBBoxes.forEach((gb, i) => {
                    if (gb.guiBox == e.target) {
                        Data.guiBBoxes.splice(i, 1)
                    }
                })
                e.target.destroy()
                stage.find('Transformer').destroy()
                layer.draw()
            }
        }
    })
}

interface ITask {
    currentIndex
    guiBBoxes: GuiBBox[]
    predicted_labels: string[][]
    annotations: string[][]
    /** */
    setCurrentIndex(index: number)
    drawBBoxLabels()
}

class Task implements ITask {
    currentIndex
    guiBBoxes: GuiBBox[]
    predicted_labels: string[][]
    annotations: string[][]

    constructor(predicted_labels: string[][], annotations) {
        this.predicted_labels = predicted_labels
        this.annotations = annotations

        // window['task'] = this
    }
    setCurrentIndex(index: number) {}
    drawBBoxLabels() {}
}

class LabelBBoxTask extends Task {
    // TODO make all relevant functions to methods

    currentIndex = 0
    guiBBoxes: GuiBBox[] = []
    predicted_labels: string[][]
    annotations: string[][]
    constructor(
        predicted_labels: string[][],
        annotations,
        guiBBoxesbbox: GuiBBox[],
        layer,
        stage
    ) {
        super(predicted_labels, annotations)
        this.guiBBoxes = guiBBoxesbbox
    }

    setCurrentIndex(index: number) {
        let predicted: string[] = Data.predicted_labels[index]

        Data.guiBBoxes[index].guiBox.stroke('red')
        Data.guiBBoxes[index].guiBox.parent.draw()

        setupAutocompleteList(predicted, this)

        let yes = $('<button class="btn btn-primary"></button>')

        if (index < Data.predicted_labels.length - 1) {
            yes.append('Next')
            yes.on('click', () => {
                yes.off('click')
                const self = this
                $('#input-item, .word-list-item').each(function() {
                    if ($(this).hasClass('active')) {
                        self.annotations[index][0] = $(this).text()
                        $(this).removeClass('active')
                        return false
                    }
                })
                Data.guiBBoxes[index].annotated = true
                Data.guiBBoxes[index].guiBox.stroke('green')
                Data.guiBBoxes[index].guiBox.parent.draw()
                this.setCurrentIndex(index + 1)
            })
        } else {
            yes.append('Finish')
            yes.on('click', () =>
                automaton.next('NEXT', {
                    labels: this.annotations,
                })
            )
        }
        $('#answer').empty().append(yes)
    }
    drawBBoxLabels() {}

    onClickPictureWords(stage, layer) {
        stage.off('click tap')
        stage.on('click tap', (e) => {
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
            this.setCurrentIndex(
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
}

class MultilabelBBoxTask extends Task {
    // TODO make all relevant functions to methods
    guiBBoxes: GuiBBox[] = []

    currentIndex = 0
    bbox: BBoxI
    kLabels: Konva.Text[]
    kBoxes: Konva.Rect[]
    predicted_labels: string[][]
    annotations: string[][]
    backLayer
    layer
    stage

    constructor(
        predicted_labels: string[][],
        annotations,
        bbox: BBox,
        layer,
        stage
    ) {
        super(predicted_labels, annotations)

        this.bbox = bbox
        this.layer = layer
        this.stage = stage
        // window['task'] = this
    }

    static drawImage(
        src: string
    ): Promise<[Konva.Stage, Konva.Layer, Konva.Image]> {
        return new Promise((resolve, reject) => {
            let image = new Image()
            image.onload = () => {
                // make image fit into picture_content

                let scale = $('#picture_content').width() / image.width
                if (
                    scale * image.height >
                    $('#picture_content').height()
                ) {
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
                    height: image.height + 20, //padding for labels
                })
                $('.konvajs-content')[0].style['box-shadow'] =
                    '-3px 5px 9px 0px grey'
                const layer = new Konva.Layer({
                    x: 0,
                    y: 20, //padding for labels
                    width: image.width,
                    height: image.height,
                })
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
     * set the currently active label at index
     * the label box is marked black
     */
    setCurrentIndex(index: number) {
        // if larger than list add another item
        if (index > this.kBoxes.length - 1) {
            this.insertLabel(index)
        }
        this.currentIndex = index
        // set label colors in Image
        for (let i = 0; i < this.kBoxes.length; i++) {
            if (i === this.currentIndex) {
                this.kBoxes[i].stroke('red').draw()
            } else {
                this.kBoxes[i].stroke('black').draw()
            }
            // the boxes are drawn over the text,
            // so we have to redraw the text after the boxes again
            this.kLabels[i].text(this.annotations[i][0]).draw()
            $('#text-input').trigger('focus').trigger('input')
        }
        // update autocomplete list
        setupAutocompleteList(
            this.predicted_labels[this.currentIndex],
            this
        )
        // TODO: set label colors at bottom
    }

    insertLabel(index) {
        this.predicted_labels.splice(index, 0, [ '/empty/' ])
        this.annotations.splice(index, 0, [ '/empty/', '/empty/' ])
        this.drawBBoxLabels()
        this.setCurrentIndex(index)
    }

    /**
     * Draw current labels as badges on top of bounding box
     * The resulting labels and boxes are saved in kLabels and kBoxes respectively
     */
    drawBBoxLabels() {
        this.layer.destroyChildren()

        let offset = this.bbox.x
        const labels = []
        const boxes = []
        for (let i = 0; i < this.annotations.length; i++) {
            const fontSize = 16
            const text = new Konva.Text({
                x: offset,
                y: this.bbox.y + 20 - fontSize - 2,
                align: 'center',
                fontSize: fontSize,
                wrap: 'word',
                // stroke: 'black',
                fill: 'black',
                // height
                text: this.annotations[i][0],
            })

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

            // TODO: maybe adjust this?
            offset = text.x() + text.width() + 6

            this.layer.add(textborder)
            this.layer.add(text)
            labels.push(text)
            boxes.push(textborder)
        }
        this.stage.off('click')
        this.stage.on('click', (e) => {
            // console.log(labels)
            // console.log(e.target)
            const index = labels.indexOf(e.target)
            if (index != -1) {
                // console.log('clicked box')
                this.setCurrentIndex(index)
                setupAutocompleteList(this.predicted_labels[index], this)
            }
        })
        this.layer.draw()
        this.kLabels = labels
        this.kBoxes = boxes
    }
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
function rescaleGuiBBoxes() {
    for (let guibox of Data.guiBBoxes) {
        const rect = guibox.guiBox
        const scalex = rect.attrs.scaleX ? rect.attrs.scaleX : 1
        const scaley = rect.attrs.scaleY ? rect.attrs.scaleY : 1
        rect.attrs.width *= scalex
        rect.attrs.height *= scaley
        rect.attrs.scaleX = 1
        rect.attrs.scaleY = 1
    }
    Data.guiBBoxes.sort(GuiBBox.sortGuiBBoxArray)
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

export class BBox implements BBoxI {
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
    fromKonvaRect(rect: Konva.Rect) {
        const scalex = rect.attrs.scaleX ? rect.attrs.scaleX : 1
        const scaley = rect.attrs.scaleY ? rect.attrs.scaleY : 1
        this.x = rect.x()
        this.y = rect.y()
        this.width = rect.width() * scalex
        this.height = rect.height() * scaley
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
    static sortBBoxArray(a: BBox, b: BBox) {
        if (a.y > b.y) {
            return 1
        }
        if (a.y < b.y) {
            return -1
        }
        return 0
    }
}

class GuiBBox {
    guiBox: Konva.Rect
    annotated: boolean
    constructor(konvaBox: Konva.Rect, annotated: boolean) {
        this.guiBox = konvaBox
        this.annotated = annotated
    }
    static sortGuiBBoxArray(a: GuiBBox, b: GuiBBox) {
        if (a.guiBox.attrs.y > b.guiBox.attrs.y) {
            return 1
        }
        if (a.guiBox.attrs.y < b.guiBox.attrs.y) {
            return -1
        }
        return 0
    }
    toBBox(): BBox {
        const scalex = this.guiBox.attrs.scaleX
            ? this.guiBox.attrs.scaleX
            : 1
        const scaley = this.guiBox.attrs.scaleY
            ? this.guiBox.attrs.scaleY
            : 1
        const x = this.guiBox.x()
        const y = this.guiBox.y()
        const width = this.guiBox.width() * scalex
        const height = this.guiBox.height() * scaley
        return new BBox([ x, y, width, height ])
    }
}

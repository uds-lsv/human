import { Task, nextState } from './services/automaton'
import { Data } from './data'
import {
    loadPicture,
    loadPDF,
    loadWords,
    showAnnotatePicture,
    showLabelBBoxes,
    showMultilabelBBox,
    showPictureBBox,
} from './pictureLabeling'

import { default as paperGlobal } from 'paper/dist/paper-core'
// import { default as paperGlobal } from 'paper' //paper-full

export var paperMain = new paperGlobal.PaperScope()
export var paperPreview = new paperGlobal.PaperScope()

paperMain.settings.handleSize = 8

window['paper'] = paperMain
window['paper2'] = paperPreview
window['paperGlobal'] = paperGlobal

/**
 * Wrapper class to register paper tools for moving shapes and zooming and panning the canvas
 */
class PaperTools {
    selectedPath = null
    newPath = true
    annotation_type: 'polygon' | 'line'
    toolButtons: JQuery<HTMLElement>[] = []

    pathStyling = {
        strokeColor: 'red',
        selected: true,
        strokeWidth: 3,
    }

    /**
     * Provides move tools for Polygons, Bounding Boxes (rectangles) and their corner points
     * @param rectangle :boolean
     *
     * Polygons:
     *  - move
     *  - delete
     *  - add points
     *  - move points
     *  - delete points
     *
     *  Bounding Box:
     *  - move
     *  - delete
     *  - move sides (by moving points)
     */
    setupMoveTool(rectangle: boolean = false) {
        paperMain.activate()
        const tool = new paperMain.Tool()
        const THRESHOLD = 3 // accuracy in px
        const hitOptions = {
            segments: true,
            stroke: true,
            fill: false,
            tolerance: THRESHOLD,
            handles: true,
        }

        let state = 'select' // possible values: idle, select, move_path, move_segment
        let selectedSegment = null // currently selected sement
        window['selectedSegment'] = selectedSegment
        tool.onMouseDown = (event) => {
            if (state == 'select') {
                const hitResult = paperMain.project.hitTest(
                    event.point,
                    hitOptions
                )
                // console.log(hitResult)

                if (hitResult) {
                    if (hitResult.type == 'stroke') {
                        // clicked on line segment between 2 points
                        if (this.selectedPath == hitResult.item) {
                            // add new segment on shift click for polygons
                            if (event.modifiers.shift && rectangle) {
                                if (selectedSegment) {
                                    selectedSegment.selected = false
                                }
                                selectedSegment = this.selectedPath.insert(
                                    hitResult.location.index + 1,
                                    event.point
                                )
                                selectedSegment.selected = true
                                // move current segment on normal click
                            } else {
                                this.selectedPath = hitResult.item
                                state = 'move_path'
                            }
                            // selecting other path
                        } else {
                            if (this.selectedPath) {
                                this.selectedPath.selected = false
                            }
                            this.selectedPath = hitResult.item
                            this.selectedPath.selected = true
                            selectedSegment = null
                        }
                    } else if (hitResult.type == 'segment') {
                        // only select segments of currently selected path
                        if (this.selectedPath == hitResult.item) {
                            if (selectedSegment) {
                                selectedSegment.selected = false
                            }
                            selectedSegment = hitResult.segment
                            selectedSegment.selected = true
                            state = 'move_segment'
                            // select other path by clicking on its segments
                        } else {
                            if (this.selectedPath) {
                                this.selectedPath.selected = false
                            }
                            selectedSegment = null
                            this.selectedPath = hitResult.item
                            this.selectedPath.selected = true
                        }
                    } else {
                        // clicked neither on segment nor on path
                        // move path if clicked inside
                        if (
                            this.selectedPath &&
                            this.selectedPath.contains(event.point)
                        ) {
                            state = 'move_path'
                        } else {
                            console.log('anywhere else')
                            if (this.selectedPath) {
                                this.selectedPath.selected = false
                                this.selectedPath = null
                            }
                            selectedSegment = null

                            // this.selectedPath
                            //     ? (this.selectedPath.selected = false)
                            //     : null
                        }
                    }
                }
            }
        }

        // move paths or segments
        tool.onMouseDrag = (event) => {
            if (state == 'move_segment') {
                if (rectangle) {
                    // segment order for rectangles
                    // 0 lower left point
                    // 1 upper left point
                    // 2 upper right point
                    // 3 lower right point
                    const opposite_index = [2, 3, 0, 1][selectedSegment.index]
                    const opposite_point =
                        selectedSegment.path.segments[opposite_index].point
                    // create new rectangle
                    this.selectedPath?.remove()
                    this.selectedPath = new paperMain.Path.Rectangle(
                        Object.assign(
                            {
                                from: opposite_point,
                                to: event.point,
                            },
                            this.pathStyling
                        )
                    )
                } else {
                    selectedSegment.point = selectedSegment.point.add(
                        event.delta
                    )
                }
            } else if (state == 'move_path') {
                this.selectedPath.position = this.selectedPath.position.add(
                    event.delta
                )
            } else {
                const pan_offset = event.point.subtract(event.downPoint)
                paperMain.project.view.center =
                    paperMain.project.view.center.subtract(pan_offset)
            }
        }

        // reset state
        tool.onMouseUp = (event) => {
            if (state == 'move_path' || state == 'move_segment') {
                state = 'select'
            }
        }

        // remove paths or segments
        tool.onKeyDown = (event) => {
            if (event.key == 'r') {
                if (state == 'select') {
                    if (selectedSegment) {
                        selectedSegment.remove()
                        selectedSegment = null
                    } else {
                        this.selectedPath.remove()
                        this.selectedPath = null
                        selectedSegment = null
                        state = 'select'
                    }
                }
            }
        }
    }
    /**
     * Activates the zoom tool globally,
     * can't be done as a paperjs tool but with native js/jquery
     */
    setupZoomTool() {
        $('#picture-canvas')
            .off('wheel')
            .on('wheel', (jqevent) => {
                var newZoom = paperMain.project.view.zoom
                var oldZoom = paperMain.project.view.zoom
                const event: WheelEvent = <WheelEvent>jqevent.originalEvent
                if (event.deltaY > 0) {
                    newZoom = paperMain.project.view.zoom * 1.05
                } else {
                    newZoom = paperMain.project.view.zoom * 0.95
                }

                var beta = oldZoom / newZoom

                var mousePosition = new paperMain.Point(
                    event.offsetX,
                    event.offsetY
                )

                //viewToProject: gives the coordinates in the Project space from the Screen Coordinates
                var viewPosition =
                    paperMain.project.view.viewToProject(mousePosition)

                var mpos = viewPosition
                var ctr = paperMain.project.view.center

                var pc = mpos.subtract(ctr)
                var offset = mpos.subtract(pc.multiply(beta)).subtract(ctr)

                paperMain.project.view.zoom = newZoom
                paperMain.project.view.center =
                    paperMain.project.view.center.add(offset)

                event.preventDefault()
                // paperMain.project.view.up.draw();
            })
    }

    activatetool(id) {
        this.toolButtons.forEach((button) => {
            button.removeClass('active')
        })
        this.toolButtons[id].addClass('active')
        paperMain.activate()
        paperMain.tools[id].activate()
        console.log(paperMain.tool)
    }
}

/**
 * Wrapper to register tools to create and modify polygons
 * and display in controls
 *
 * Pen, Path, Move, Zoom
 */
class PaperPolygonTools extends PaperTools {
    constructor(state, data) {
        super()
        this.annotation_type = state['shape_type']
            ? state['shape_type']
            : 'polygon'

        // setup tools
        while (paperMain.tools.length != 0) {
            paperMain.tools[0].remove()
        }
        // TODO not sure if this option is ever wanted actually
        // maybe rather options in the tools themselves, like hit tolerance, simplification factor, etc
        // or have that as user preferences?

        // if (state.tools) {
        //     state.tools.foreach((name) => {
        //         switch (name) {
        //             case 'line':
        //                 this.setupLineTool()
        //                 break
        //             case 'path':
        //                 this.setupPathTool()
        //                 break
        //             case 'move':
        //                 this.setupMoveTool()
        //                 break
        //             case 'zoom':
        //                 this.setupZoomTool()
        //                 break
        //         }
        //     })
        // } else {
        this.setupLineTool()
        this.setupPathTool()
        // this.setupWandTool()
        this.setupMoveTool()
        // this.setupPanTool()
        this.setupZoomTool()
        // }
        this.setupToolButtons()
    }

    setupToolButtons() {
        // controls in bottom container
        const buttonContainer = $(
            '<div style="display: flex; justify-content: space-evenly"></div>'
        )
        $('#controls').empty().append(buttonContainer)
        // , '<div style="padding:1em"></div>')
        const pen =
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/></svg>'
        const path =
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bezier" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M0 10.5A1.5 1.5 0 0 1 1.5 9h1A1.5 1.5 0 0 1 4 10.5v1A1.5 1.5 0 0 1 2.5 13h-1A1.5 1.5 0 0 1 0 11.5v-1zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zm10.5.5A1.5 1.5 0 0 1 13.5 9h1a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 1-1.5-1.5v-1zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zM6 4.5A1.5 1.5 0 0 1 7.5 3h1A1.5 1.5 0 0 1 10 4.5v1A1.5 1.5 0 0 1 8.5 7h-1A1.5 1.5 0 0 1 6 5.5v-1zM7.5 4a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1z"/><path d="M6 4.5H1.866a1 1 0 1 0 0 1h2.668A6.517 6.517 0 0 0 1.814 9H2.5c.123 0 .244.015.358.043a5.517 5.517 0 0 1 3.185-3.185A1.503 1.503 0 0 1 6 5.5v-1zm3.957 1.358A1.5 1.5 0 0 0 10 5.5v-1h4.134a1 1 0 1 1 0 1h-2.668a6.517 6.517 0 0 1 2.72 3.5H13.5c-.123 0-.243.015-.358.043a5.517 5.517 0 0 0-3.185-3.185z"/></svg>'
        // const wand =
        //     '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-magic" viewBox="0 0 16 16"><path d="M9.5 2.672a.5.5 0 1 0 1 0V.843a.5.5 0 0 0-1 0v1.829Zm4.5.035A.5.5 0 0 0 13.293 2L12 3.293a.5.5 0 1 0 .707.707L14 2.707ZM7.293 4A.5.5 0 1 0 8 3.293L6.707 2A.5.5 0 0 0 6 2.707L7.293 4Zm-.621 2.5a.5.5 0 1 0 0-1H4.843a.5.5 0 1 0 0 1h1.829Zm8.485 0a.5.5 0 1 0 0-1h-1.829a.5.5 0 0 0 0 1h1.829ZM13.293 10A.5.5 0 1 0 14 9.293L12.707 8a.5.5 0 1 0-.707.707L13.293 10ZM9.5 11.157a.5.5 0 0 0 1 0V9.328a.5.5 0 0 0-1 0v1.829Zm1.854-5.097a.5.5 0 0 0 0-.706l-.708-.708a.5.5 0 0 0-.707 0L8.646 5.94a.5.5 0 0 0 0 .707l.708.708a.5.5 0 0 0 .707 0l1.293-1.293Zm-3 3a.5.5 0 0 0 0-.706l-.708-.708a.5.5 0 0 0-.707 0L.646 13.94a.5.5 0 0 0 0 .707l.708.708a.5.5 0 0 0 .707 0L8.354 9.06Z"/></svg>'
        const move =
            // '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-magic" viewBox="0 0 16 16"><path d="M9.5 2.672a.5.5 0 1 0 1 0V.843a.5.5 0 0 0-1 0v1.829Zm4.5.035A.5.5 0 0 0 13.293 2L12 3.293a.5.5 0 1 0 .707.707L14 2.707ZM7.293 4A.5.5 0 1 0 8 3.293L6.707 2A.5.5 0 0 0 6 2.707L7.293 4Zm-.621 2.5a.5.5 0 1 0 0-1H4.843a.5.5 0 1 0 0 1h1.829Zm8.485 0a.5.5 0 1 0 0-1h-1.829a.5.5 0 0 0 0 1h1.829ZM13.293 10A.5.5 0 1 0 14 9.293L12.707 8a.5.5 0 1 0-.707.707L13.293 10ZM9.5 11.157a.5.5 0 0 0 1 0V9.328a.5.5 0 0 0-1 0v1.829Zm1.854-5.097a.5.5 0 0 0 0-.706l-.708-.708a.5.5 0 0 0-.707 0L8.646 5.94a.5.5 0 0 0 0 .707l.708.708a.5.5 0 0 0 .707 0l1.293-1.293Zm-3 3a.5.5 0 0 0 0-.706l-.708-.708a.5.5 0 0 0-.707 0L.646 13.94a.5.5 0 0 0 0 .707l.708.708a.5.5 0 0 0 .707 0L8.354 9.06Z"/></svg>'
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bounding-box-circles" viewBox="0 0 16 16"><path d="M2 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM0 2a2 2 0 0 1 3.937-.5h8.126A2 2 0 1 1 14.5 3.937v8.126a2 2 0 1 1-2.437 2.437H3.937A2 2 0 1 1 1.5 12.063V3.937A2 2 0 0 1 0 2zm2.5 1.937v8.126c.703.18 1.256.734 1.437 1.437h8.126a2.004 2.004 0 0 1 1.437-1.437V3.937A2.004 2.004 0 0 1 12.063 2.5H3.937A2.004 2.004 0 0 1 2.5 3.937zM14 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM2 13a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm12 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>'
        const pan =
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrows-move" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M7.646.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 1.707V5.5a.5.5 0 0 1-1 0V1.707L6.354 2.854a.5.5 0 1 1-.708-.708l2-2zM8 10a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L7.5 14.293V10.5A.5.5 0 0 1 8 10zM.146 8.354a.5.5 0 0 1 0-.708l2-2a.5.5 0 1 1 .708.708L1.707 7.5H5.5a.5.5 0 0 1 0 1H1.707l1.147 1.146a.5.5 0 0 1-.708.708l-2-2zM10 8a.5.5 0 0 1 .5-.5h3.793l-1.147-1.146a.5.5 0 0 1 .708-.708l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L14.293 8.5H10.5A.5.5 0 0 1 10 8z"/></svg>'

        const icons = [pen, path, /*wand, */ /*move,*/ pan]
        icons.forEach((icon, i) => {
            const tip = $(
                '<span class="badge position-absolute" style="left: 0;"></span>'
            ).append(i + 1 + '')
            const button = $(
                '<button class="btn btn-primary" style="margin: 5px; position: relative"></button>'
            )
                .append(tip)
                .append(icon)
                .on('click', () => {
                    console.log('button0')
                    this.activatetool(i)
                    this.selectedPath = null
                    paperMain.project.activeLayer.selected = false //DISCUSS keep selection when switching to move tool?
                })
                .on('mousedown', (event) => {
                    event.preventDefault()
                })
            this.toolButtons.push(button)

            buttonContainer.append(button)
        })
        this.toolButtons[0].addClass('active')
        // this.buttonContainer = buttonContainer
    }
    setupLineTool() {
        const tool = new paperMain.Tool()
        tool.onMouseDrag = (event) => {
            if (event.point.isInside(event.tool.view?.bounds)) {
                this.selectedPath.add(event.point)
            }
        }
        tool.onMouseDown = (event) => {
            if (this.selectedPath) {
                this.selectedPath.selected = false
            }

            // Create a new path and set its stroke color to black:
            this.selectedPath = new paperMain.Path(
                Object.assign(
                    {
                        segments: [event.point],
                    },
                    this.pathStyling
                    // {
                    //     strokeColor: 'red',
                    //     // Select the path, so we can see its segment points:
                    //     fullySelected: true,
                    //     strokeWidth: 5,
                    // }
                )
            )
        }

        tool.onMouseUp = (event) => {
            console.log(event)
            if (this.annotation_type == 'polygon') {
                this.selectedPath.closePath()
            }
            this.selectedPath.simplify(1)
            this.selectedPath.flatten(100)
            this.selectedPath.selected = false
            this.selectedPath = null
        }
    }

    // create new paths (either polygons or lines)
    setupPathTool() {
        paperMain.activate()

        const tool = new paperMain.Tool()

        const THRESHOLD = 10 // accuracy in px

        tool.onMouseDown = (event) => {
            // if clicked near first point of path and type is polygon
            if (
                this.selectedPath &&
                this.annotation_type == 'polygon' &&
                event.point.getDistance(this.selectedPath.firstSegment.point) <
                    THRESHOLD
            ) {
                this.selectedPath.closed = true
                this.selectedPath.selected = false
                this.selectedPath = null
                this.newPath = true
            } else {
                if (!this.selectedPath || this.newPath) {
                    // create a new path
                    if (this.selectedPath) {
                        this.selectedPath.selected = false
                    }
                    this.selectedPath = new paperMain.Path(this.pathStyling)
                    this.newPath = false
                }
                this.selectedPath.add(event.point)
            }
        }

        tool.onKeyDown = (event) => {
            // remove last added segment
            if (event.key == 'r') {
                if (this.selectedPath) {
                    this.selectedPath.lastSegment.remove()
                    if (this.selectedPath.segments.length == 0) {
                        this.selectedPath.remove()
                        this.selectedPath = null
                    }
                }
                // finalize path (close for polygons)
            } else if (event.key == 'enter') {
                console.log('enter')
                if (this.selectedPath) {
                    if (this.annotation_type == 'polygon') {
                        this.selectedPath.closed = true
                    }
                    this.newPath = true
                    this.selectedPath.selected = false
                    this.selectedPath = null
                }
            }
        }
    }
}

/**
 * Wrapper to register tools to create and modify bounding boxes
 * and display in controls
 *
 * Add rectangle, Move, Zoom
 */
class PaperBoundingBoxTools extends PaperTools {
    constructor(state, data) {
        super()
        // setup tools
        while (paperMain.tools.length != 0) {
            paperMain.tools[0].remove()
        }

        // TODO see PaperPolygonTools todo

        this.setupBoundingBoxTool()
        this.setupMoveTool(true)
        this.setupZoomTool()
        this.setupToolButtons()
    }

    /**
     * Add Paper tool with which a user can add rectangles via drag and drop.
     */
    setupBoundingBoxTool() {
        const tool = new paperMain.Tool()

        tool.onMouseDrag = (event) => {
            if (event.point.isInside(event.tool.view?.bounds)) {
                console.log(event)
                console.log(this.selectedPath)
                this.selectedPath ? this.selectedPath.remove() : null
                this.selectedPath = new paperMain.Path.Rectangle(
                    Object.assign(
                        {
                            from: event.downPoint,
                            to: event.point,
                        },
                        this.pathStyling
                    )
                )
            }
        }

        tool.onMouseDown = (event) => {
            console.log(event)
            this.selectedPath = new paperMain.Path.Rectangle(
                Object.assign(
                    {
                        from: event.downPoint,
                        to: event.point,
                    },
                    this.pathStyling
                )
            )
        }

        tool.onMouseUp = (event) => {
            console.log(event)
            this.selectedPath.selected = false
            this.selectedPath = null
        }
    }

    /**
     * Add buttons for tools and put them in #controls container
     *
     * Bounding box has two tools - adding and editing rectangles
     */
    setupToolButtons() {
        const buttonContainer = $(
            '<div style="display: flex; justify-content: space-evenly"></div>'
        )
        $('#controls').empty().append(buttonContainer)
        // , '<div style="padding:1em"></div>')
        const pen =
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/></svg>'
        const path =
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bezier" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M0 10.5A1.5 1.5 0 0 1 1.5 9h1A1.5 1.5 0 0 1 4 10.5v1A1.5 1.5 0 0 1 2.5 13h-1A1.5 1.5 0 0 1 0 11.5v-1zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zm10.5.5A1.5 1.5 0 0 1 13.5 9h1a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 1-1.5-1.5v-1zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zM6 4.5A1.5 1.5 0 0 1 7.5 3h1A1.5 1.5 0 0 1 10 4.5v1A1.5 1.5 0 0 1 8.5 7h-1A1.5 1.5 0 0 1 6 5.5v-1zM7.5 4a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1z"/><path d="M6 4.5H1.866a1 1 0 1 0 0 1h2.668A6.517 6.517 0 0 0 1.814 9H2.5c.123 0 .244.015.358.043a5.517 5.517 0 0 1 3.185-3.185A1.503 1.503 0 0 1 6 5.5v-1zm3.957 1.358A1.5 1.5 0 0 0 10 5.5v-1h4.134a1 1 0 1 1 0 1h-2.668a6.517 6.517 0 0 1 2.72 3.5H13.5c-.123 0-.243.015-.358.043a5.517 5.517 0 0 0-3.185-3.185z"/></svg>'
        // const wand =
        //     '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-magic" viewBox="0 0 16 16"><path d="M9.5 2.672a.5.5 0 1 0 1 0V.843a.5.5 0 0 0-1 0v1.829Zm4.5.035A.5.5 0 0 0 13.293 2L12 3.293a.5.5 0 1 0 .707.707L14 2.707ZM7.293 4A.5.5 0 1 0 8 3.293L6.707 2A.5.5 0 0 0 6 2.707L7.293 4Zm-.621 2.5a.5.5 0 1 0 0-1H4.843a.5.5 0 1 0 0 1h1.829Zm8.485 0a.5.5 0 1 0 0-1h-1.829a.5.5 0 0 0 0 1h1.829ZM13.293 10A.5.5 0 1 0 14 9.293L12.707 8a.5.5 0 1 0-.707.707L13.293 10ZM9.5 11.157a.5.5 0 0 0 1 0V9.328a.5.5 0 0 0-1 0v1.829Zm1.854-5.097a.5.5 0 0 0 0-.706l-.708-.708a.5.5 0 0 0-.707 0L8.646 5.94a.5.5 0 0 0 0 .707l.708.708a.5.5 0 0 0 .707 0l1.293-1.293Zm-3 3a.5.5 0 0 0 0-.706l-.708-.708a.5.5 0 0 0-.707 0L.646 13.94a.5.5 0 0 0 0 .707l.708.708a.5.5 0 0 0 .707 0L8.354 9.06Z"/></svg>'
        const move =
            // '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-magic" viewBox="0 0 16 16"><path d="M9.5 2.672a.5.5 0 1 0 1 0V.843a.5.5 0 0 0-1 0v1.829Zm4.5.035A.5.5 0 0 0 13.293 2L12 3.293a.5.5 0 1 0 .707.707L14 2.707ZM7.293 4A.5.5 0 1 0 8 3.293L6.707 2A.5.5 0 0 0 6 2.707L7.293 4Zm-.621 2.5a.5.5 0 1 0 0-1H4.843a.5.5 0 1 0 0 1h1.829Zm8.485 0a.5.5 0 1 0 0-1h-1.829a.5.5 0 0 0 0 1h1.829ZM13.293 10A.5.5 0 1 0 14 9.293L12.707 8a.5.5 0 1 0-.707.707L13.293 10ZM9.5 11.157a.5.5 0 0 0 1 0V9.328a.5.5 0 0 0-1 0v1.829Zm1.854-5.097a.5.5 0 0 0 0-.706l-.708-.708a.5.5 0 0 0-.707 0L8.646 5.94a.5.5 0 0 0 0 .707l.708.708a.5.5 0 0 0 .707 0l1.293-1.293Zm-3 3a.5.5 0 0 0 0-.706l-.708-.708a.5.5 0 0 0-.707 0L.646 13.94a.5.5 0 0 0 0 .707l.708.708a.5.5 0 0 0 .707 0L8.354 9.06Z"/></svg>'
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bounding-box-circles" viewBox="0 0 16 16"><path d="M2 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM0 2a2 2 0 0 1 3.937-.5h8.126A2 2 0 1 1 14.5 3.937v8.126a2 2 0 1 1-2.437 2.437H3.937A2 2 0 1 1 1.5 12.063V3.937A2 2 0 0 1 0 2zm2.5 1.937v8.126c.703.18 1.256.734 1.437 1.437h8.126a2.004 2.004 0 0 1 1.437-1.437V3.937A2.004 2.004 0 0 1 12.063 2.5H3.937A2.004 2.004 0 0 1 2.5 3.937zM14 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM2 13a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm12 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>'
        const pan =
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrows-move" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M7.646.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 1.707V5.5a.5.5 0 0 1-1 0V1.707L6.354 2.854a.5.5 0 1 1-.708-.708l2-2zM8 10a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L7.5 14.293V10.5A.5.5 0 0 1 8 10zM.146 8.354a.5.5 0 0 1 0-.708l2-2a.5.5 0 1 1 .708.708L1.707 7.5H5.5a.5.5 0 0 1 0 1H1.707l1.147 1.146a.5.5 0 0 1-.708.708l-2-2zM10 8a.5.5 0 0 1 .5-.5h3.793l-1.147-1.146a.5.5 0 0 1 .708-.708l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L14.293 8.5H10.5A.5.5 0 0 1 10 8z"/></svg>'

        const icons = [/*pen, path, wand, */ move, pan]
        icons.forEach((icon, i) => {
            const tip = $(
                '<span class="badge position-absolute" style="left: 0;"></span>'
            ).append(i + 1 + '')
            const button = $(
                '<button class="btn btn-primary" style="margin: 5px; position: relative"></button>'
            )
                .append(tip)
                .append(icon)
                .on('click', () => {
                    console.log('button0')
                    this.activatetool(i)
                    this.selectedPath = null
                    paperMain.project.activeLayer.selected = false //DISCUSS keep selection when switching to move tool?
                })
                .on('mousedown', (event) => {
                    event.preventDefault()
                })
            this.toolButtons.push(button)

            buttonContainer.append(button)
        })
        this.toolButtons[0].addClass('active')
    }
}

/**
 * Draws and scales image and sets up paper project
 * @param src image source string
 * @returns Promise<void> when image is setup with paper
 */
function setupMain(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        let image = new Image()

        image.onload = () => {
            Data['main_image'] = {
                height: image.height,
                width: image.width,
            }

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
            Data.scales.x = scale
            Data.scales.y = 2500 / image.height
            // $('#picture-canvas').hide()
            $('#picture-canvas').height(image.height)
            $('#picture-canvas').width(image.width)

            // setup stage with previously calculated scaling
            while (paperMain.projects.length != 0) {
                paperMain.projects[0].remove()
            }
            paperMain.setup('picture-canvas')

            $('#picture-canvas')[0].style['box-shadow'] =
                '-3px 5px 9px 0px grey'

            const raster = new paperMain.Raster({
                image: image,
                position: paperMain.view.center,
            })
            raster.scale(scale, paperMain.view.center)

            while (paperMain.tools.length != 0) {
                paperMain.tools[0].remove()
            }
            resolve()
        }
        // load image
        image.src = src
    })
}
/**
 * Picture Polygon Task
 * Add polygon with paper
 * Tools: pen, path, move, zoom
 */
export class PicturePolygonTask implements Task {
    tools
    constructor(state, data) {
        this.onEntry(state['question'], state['answer']).then(
            () => (this.tools = new PaperPolygonTools(state, data))
        )
    }

    async onEntry(question: string, answer: string = 'Continue') {
        await loadPicture()
        $('#question').append(question)
        const answer_button = $(
            `<button id="answer_button" class="btn btn-primary btn-block" style="margin: 10px 0 10px 0;position: relative">${answer}</button>`
        )
        answer_button.on('click', () => {
            answer_button.attr('disabled')
            let scaled_polygons = []
            paperMain.project.activeLayer.children.forEach((child) => {
                if (child instanceof paperMain.Path) {
                    //DISCUSS nicer way of doing this?
                    let segments = []
                    child['segments'].forEach((segment) => {
                        segments.push([
                            // 2, 82.54619598388672
                            segment['point']['x'] / Data.scales.x,
                            segment['point']['y'] / Data.scales.x,
                        ])
                    })
                    scaled_polygons.push(segments)
                }
            })
            const data = { annotation: {} }
            data['annotation'] = scaled_polygons
            nextState('NEXT', data) // 2nd arg passed to backend
        })
        $('#answer').append(answer_button)
        await setupMain(Data['picture'])
        this.setupHotKeys()
    }
    setupHotKeys() {
        $(document)
            .off('keyup')
            .on('keyup', (event) => {
                switch (event.key) {
                    case '1':
                        this.tools.activatetool(0)
                        break
                    case '2':
                        this.tools.activatetool(1)
                        break
                    case '3':
                        this.tools.activatetool(2)
                        break
                    case 'Enter':
                        console.log('enter pressed')
                        if (event.shiftKey) {
                            $('.btn .bi-arrow-down').trigger('click')
                        }
                    case '=':
                        paperMain.project.view.zoom = 1
                        paperMain.project.view.center = new paperMain.Point(
                            paperMain.project.view.viewSize.divide(2)
                        )
                    // console.log('set zoom to 100%')
                }
            })
    }

    async onExit() {
        $('#question').empty()
        $('#answer').empty()
    }
}

/**
 * Picture Bounding Box Task
 * Add Rectangles with paper
 *
 * Tools: Add Rectangle, move, zoom
 */

export class PictureBBoxesTask implements Task {
    tools

    constructor(state, data) {
        this.onEntry(state['question'], state['answer']).then(
            () => (this.tools = new PaperBoundingBoxTools(state, data))
        )
    }

    async onEntry(question: string, answer: string = 'Continue') {
        await loadPicture()
        $('#question').append(question)
        const answer_button = $(
            `<button id="answer_button" class="btn btn-primary btn-block" style="margin: 10px 0 10px 0;position: relative">${answer}</button>`
        )
        answer_button.on('click', () => {
            answer_button.attr('disabled')
            let scaled_polygons = []
            paperMain.project.activeLayer.children.forEach((child) => {
                if (child instanceof paperMain.Path) {
                    //DISCUSS nicer way of doing this?
                    let segments = []
                    child['segments'].forEach((segment) => {
                        segments.push([
                            // 2, 82.54619598388672
                            segment['point']['x'] / Data.scales.x,
                            segment['point']['y'] / Data.scales.x,
                        ])
                    })
                    scaled_polygons.push(segments)
                }
            })
            const data = { annotation: {} }
            data['annotation'] = scaled_polygons
            nextState('NEXT', data) // 2nd arg passed to backend
        })
        $('#answer').append(answer_button)
        await setupMain(Data['picture'])
        this.setupHotKeys()
    }
    setupHotKeys() {
        $(document)
            .off('keyup')
            .on('keyup', (event) => {
                switch (event.key) {
                    case '1':
                        this.tools.activatetool(0)
                        break
                    case '2':
                        this.tools.activatetool(1)
                        break
                    case '3':
                        this.tools.activatetool(2)
                        break
                    case 'Enter':
                        console.log('enter pressed')
                        if (event.shiftKey) {
                            $('.btn .bi-arrow-down').trigger('click')
                        }
                    case '=':
                        paperMain.project.view.zoom = 1
                        paperMain.project.view.center = new paperMain.Point(
                            paperMain.project.view.viewSize.divide(2)
                        )
                    // console.log('set zoom to 100%')
                }
            })
    }

    async onExit() {
        $('#question').empty()
        $('#answer').empty()
    }
}

declare var pdfjsLib: any

pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.12.313/pdf.worker.min.js'

export class PDFService {
    static PDFJS = pdfjsLib
    static __PDF_DOC
    static __CURRENT_PAGE
    static __TOTAL_PAGES
    static __PAGE_RENDERING_IN_PROGRESS = 0
    static __CANVAS = $('#pdf-canvas').get(0) as HTMLCanvasElement
    static __CANVAS_CTX = PDFService.__CANVAS.getContext('2d')

    static init_controls() {
        $('#pdf-prev').off('click')
        $('#pdf-prev').on('click', () => {
            if (PDFService.__CURRENT_PAGE != 1)
                PDFService.showPage(--PDFService.__CURRENT_PAGE)
        })
        // Next page of the PDF
        $('#pdf-next').off('click')
        $('#pdf-next').on('click', () => {
            if (PDFService.__CURRENT_PAGE != PDFService.__TOTAL_PAGES)
                PDFService.showPage(++PDFService.__CURRENT_PAGE)
        })
    }

    // Initialize and load the PDF
    static showPDF(pdf_url): Promise<void> {
        // Show the pdf loader
        $('#pdf-loader').show()
        ;($('#pdf-canvas').get(0) as HTMLCanvasElement).width =
            $('.pictureContainer').width()
        ;($('#pdf-canvas').get(0) as HTMLCanvasElement).height =
            $('.pictureContainer').height()
        PDFService.__CANVAS = $('#pdf-canvas').get(0) as HTMLCanvasElement
        PDFService.__CANVAS_CTX = PDFService.__CANVAS.getContext('2d')

        return PDFService.PDFJS.getDocument({ url: pdf_url })
            .promise.then((pdf_doc) => {
                PDFService.__PDF_DOC = pdf_doc
                PDFService.__TOTAL_PAGES = PDFService.__PDF_DOC.numPages

                // Hide the pdf loader and show pdf container in HTML
                $('#pdf-loader').hide()
                $('#pdf-contents').show()
                $('.pdf-total-pages').text(PDFService.__TOTAL_PAGES)

                console.log('hideshow')
                // Show the first page
                PDFService.showPage(1)
                console.log('showpagedone')

                PDFService.loadPreviews()
            })
            .catch(function (error) {
                // If error re-show the upload button
                $('#pdf-loader').hide()
                $('#upload-button').show()
                alert(error.message)
            })
    }
    static showPage(page_no) {
        PDFService.__PAGE_RENDERING_IN_PROGRESS = 1
        PDFService.__CURRENT_PAGE = page_no

        // Disable Prev & Next buttons while page is being loaded
        $('#pdf-next, #pdf-prev').attr('disabled', 'disabled')

        // While page is being rendered hide the canvas and show a loading message
        $('#pdf-canvas').hide()
        $('#page-loader').show()

        // Update current page in HTML
        $('.pdf-current-page').text(page_no)

        // Fetch the page
        PDFService.__PDF_DOC.getPage(page_no).then((page) => {
            // As the canvas is of a fixed width we need to set the scale of the viewport accordingly
            console.log(page)
            let scale_required =
                PDFService.__CANVAS.width / page.getViewport({ scale: 1 }).width

            // Get viewport of the page at required scale
            let viewport = page.getViewport(scale_required)
            console.log(viewport)
            console.log(PDFService.__CANVAS.height)
            console.log(PDFService.__CANVAS.width)

            // check if viewport is too high
            if (viewport.height > $(PDFService.__CANVAS).height()) {
                scale_required =
                    PDFService.__CANVAS.height /
                    page.getViewport({ scale: 1 }).height
                viewport = page.getViewport(scale_required)
                // Set canvas height
                // $('#pdf-canvas').width(viewport.width)
                // $('#pdf-canvas').height(viewport.height)
                PDFService.__CANVAS.width = viewport.width
            } else {
                // Set canvas height
                // $('#pdf-canvas').width(viewport.width)
                // $('#pdf-canvas').height(viewport.height)
                PDFService.__CANVAS.height = viewport.height
            }

            const renderContext = {
                canvasContext: PDFService.__CANVAS_CTX,
                viewport: viewport,
            }

            // Render the page contents in the canvas
            page.render(renderContext).promise.then(function () {
                PDFService.__PAGE_RENDERING_IN_PROGRESS = 0

                // Re-enable Prev & Next buttons
                $('#pdf-next, #pdf-prev').removeAttr('disabled')

                // Show the canvas and hide the page loader
                $('#pdf-canvas').show()
                $('#page-loader').hide()
            })
        })
    }
    static async loadPreviews() {
        const previewList = $('#pdf-preview')
        const listWidth = previewList.width()
        const display_preview = (n) =>
            new Promise((resolve, reject) => {
                const canvas = document.createElement('canvas')
                PDFService.__PDF_DOC.getPage(n).then((page) => {
                    // calculate ratio of list container to pdf page
                    const ratio =
                        (listWidth - 15) / page.getViewport({ scale: 1 }).width
                    // get pdf viewport in that ratio
                    const viewport = page.getViewport(ratio)
                    // set canvas height and width according to ratio
                    canvas.height = viewport.height
                    canvas.width = viewport.width
                    $(canvas).css('box-shadow', '-3px 5px 9px 0px grey')
                    // add on click listener to jump to page
                    $(canvas).on('click', () => {
                        PDFService.showPage(n)
                    })
                    const renderContext = {
                        canvasContext: canvas.getContext('2d'),
                        viewport: viewport,
                    }
                    // render the page and then append to the list container
                    page.render(renderContext).promise.then(() => {
                        previewList.append($(canvas))
                        resolve(1)
                    })
                })
            })
        for (let n = 1; n <= PDFService.__TOTAL_PAGES; n++) {
            await display_preview(n)
        }
    }
    static loadFullSizePDF(): Promise<HTMLCanvasElement> {
        return new Promise((resolve, reject) => {
            PDFService.__PDF_DOC
                .getPage(PDFService.__CURRENT_PAGE)
                .then((page) => {
                    const canvas = document.createElement('canvas')
                    canvas.width = page.getViewport(1).width
                    canvas.height = page.getViewport(1).height
                    var renderContext = {
                        canvasContext: canvas.getContext('2d'),
                        viewport: page.getViewport(1),
                    }
                    page.render(renderContext).promise.then(() => {
                        resolve(canvas)
                    })
                })
        })
    }
}

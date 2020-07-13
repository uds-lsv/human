declare var pdfjsLib: any
// declare var $
var PDFJS = pdfjsLib,
    __PDF_DOC,
    __CURRENT_PAGE,
    __TOTAL_PAGES,
    __PAGE_RENDERING_IN_PROGRESS = 0,
    __CANVAS = $('#pdf-canvas').get(0) as HTMLCanvasElement,
    __CANVAS_CTX = __CANVAS.getContext('2d')

// Initialize and load the PDF
export function showPDF(pdf_url): Promise<void> {
    // Show the pdf loader
    $('#pdf-loader').show()
    ;($('#pdf-canvas').get(0) as HTMLCanvasElement).width = $(
        '.pictureContainer'
    ).width()
    ;($('#pdf-canvas').get(0) as HTMLCanvasElement).height = $(
        '.pictureContainer'
    ).height()

    return PDFJS.getDocument({ url: pdf_url })
        .then(function(pdf_doc) {
            __PDF_DOC = pdf_doc
            __TOTAL_PAGES = __PDF_DOC.numPages

            // Hide the pdf loader and show pdf container in HTML
            $('#pdf-loader').hide()
            $('#pdf-contents').show()
            $('.pdf-total-pages').text(__TOTAL_PAGES)

            // Show the first page
            showPage(1)
        })
        .catch(function(error) {
            // If error re-show the upload button
            $('#pdf-loader').hide()
            $('#upload-button').show()

            alert(error.message)
        })
}

// Load and render a specific page of the PDF
function showPage(page_no) {
    __PAGE_RENDERING_IN_PROGRESS = 1
    __CURRENT_PAGE = page_no

    // Disable Prev & Next buttons while page is being loaded
    $('#pdf-next, #pdf-prev').attr('disabled', 'disabled')

    // While page is being rendered hide the canvas and show a loading message
    $('#pdf-canvas').hide()
    $('#page-loader').show()

    // Update current page in HTML
    $('.pdf-current-page').text(page_no)

    // Fetch the page
    __PDF_DOC.getPage(page_no).then(function(page) {
        // As the canvas is of a fixed width we need to set the scale of the viewport accordingly
        var scale_required = __CANVAS.width / page.getViewport(1).width

        // Get viewport of the page at required scale
        var viewport = page.getViewport(scale_required)

        // check if viewport is too high
        if (viewport.height > __CANVAS.height) {
            scale_required = __CANVAS.height / page.getViewport(1).height
            viewport = page.getViewport(scale_required)
            // Set canvas height
            __CANVAS.width = viewport.width
        } else {
            // Set canvas height
            __CANVAS.height = viewport.height
        }

        var renderContext = {
            canvasContext: __CANVAS_CTX,
            viewport: viewport,
        }

        // Render the page contents in the canvas
        page.render(renderContext).then(function() {
            __PAGE_RENDERING_IN_PROGRESS = 0

            // Re-enable Prev & Next buttons
            $('#pdf-next, #pdf-prev').removeAttr('disabled')

            // Show the canvas and hide the page loader
            $('#pdf-canvas').show()
            $('#page-loader').hide()
        })
    })
}

// Upon click this should trigger click on the <input type="file" /> element
// This is better than showing the ugly looking file input element
// $('#upload-button').on('click', function() {
//     $('#file-to-upload').trigger('click')
// })

// When user chooses a PDF file
// $('#file-to-upload').on('change', function() {
//     $('#upload-button').hide()

//     // Send the object url of the pdf
//     showPDF(URL.createObjectURL($('#file-to-upload').get(0).files[0]))
// })

// Previous page of the PDF
$('#pdf-prev').on('click', function() {
    if (__CURRENT_PAGE != 1) showPage(--__CURRENT_PAGE)
})

// Next page of the PDF
$('#pdf-next').on('click', function() {
    if (__CURRENT_PAGE != __TOTAL_PAGES) showPage(++__CURRENT_PAGE)
})

export function loadFullSizePDF(): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
        __PDF_DOC.getPage(__CURRENT_PAGE).then((page) => {
            const canvas = document.createElement('canvas')
            canvas.width = page.getViewport(1).width
            canvas.height = page.getViewport(1).height
            var renderContext = {
                canvasContext: canvas.getContext('2d'),
                viewport: page.getViewport(1),
            }
            page.render(renderContext).then(() => {
                resolve(canvas)
            })
        })
    })
}

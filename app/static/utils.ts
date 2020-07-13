/**
* Convert Blob to a src DataURL for Images
* @param {Blob} blob 
*/
export function blobToDataURL(blob: Blob): Promise<string | ArrayBuffer> {
    return new Promise((resolve, reject) => {
        try {
            var a = new FileReader()
            a.onload = function(e) {
                resolve(e.target.result)
            }
            a.readAsDataURL(blob)
        } catch (error) {
            reject(error)
        }
    })
}

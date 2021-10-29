const video = document.getElementById('video')
const input = document.getElementById('output')
const loader = document.querySelector('.loader-wrapper')
let canvas;

startAi();

var loadFile = async function (evt) {


    if (input.src.length != 0) {
        canvas.remove()
    }

    var tgt = evt.target || window.event.target,
        files = tgt.files;
    if (FileReader && files && files.length) {
        var fr = new FileReader();
        fr.onload = function () {
            document.getElementById('output').src = fr.result;
            loader.classList.remove('disappear');
        }
        fr.readAsDataURL(files[0]);
        fr.addEventListener('progress', (event) => {
            if (event.loaded && event.total) {
                setTimeout(() => {
                    startRecognition(0);
                }, 1500);

            }
        });
    }

};


function startAi() {
    console.log('loading models')
    Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
        faceapi.nets.faceExpressionNet.loadFromUri('./models'),
        faceapi.nets.ageGenderNet.loadFromUri('./models')
    ]).then(loaded);
}

function loaded() {
    console.log('models loaded')
    document.querySelector('.upload-label').classList.remove('disabled');
    document.querySelector('.model-load').classList.add('hidden');
    loader.classList.add('disappear');


}

async function startRecognition() {
    console.log('loading canvas');
    canvas = faceapi.createCanvasFromMedia(input)

    var displaySize = {
        width: input.width,
        height: input.height
    }

    faceapi.matchDimensions(canvas, displaySize)
    const detections = await faceapi.detectAllFaces(input, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withAgeAndGender().withFaceDescriptors()
    if (! detections.length) {
        alert('No face detected. Please try a different image!');
        loader.classList.add('disappear');
        return;
    }


    const resizedDetections = faceapi.resizeResults(detections, displaySize)


    faceapi.draw.drawDetections(canvas, resizedDetections)
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)


    resizedDetections.forEach(result => {
        const {age, gender, genderProbability, expressions} = result
        new faceapi.draw.DrawTextField([
            `${
                faceapi.utils.round(age, 0)
            } years`,
            `${gender} (${
                faceapi.utils.round(genderProbability)
            })`,
            `${
                faceapi.utils.round(expressions.neutral)
            } neutral`,
            `${
                faceapi.utils.round(expressions.angry)
            } angry`,
            `${
                faceapi.utils.round(expressions.happy)
            } happy`
        ], result.detection.box.bottomLeft).draw(canvas)
    })

    document.body.querySelector('.canvas').append(canvas);
    loader.classList.add('disappear');

    // canvas.toBlob(function(blob) {
    //     saveAs(blob, "pretty image.png");
    // });

}

let localStream;
function startVideo() {

    navigator.getUserMedia({
        video: {}
    }, 
    (stream) => {
      
      video.srcObject = stream;
      localStream = stream;
    }, 

    err => console.error(err),
    
    )
}

var intervalID;
var vidCanvas;

video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video)
    vidCanvas = canvas;
    document.body.querySelector('.video-section').append(canvas);
    const displaySize = {
        width: video.width,
        height: video.height
    }
    faceapi.matchDimensions(canvas, displaySize)
    intervalID= setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withAgeAndGender().withFaceDescriptors()
        const resizedDetections = faceapi.resizeResults(detections, displaySize)

        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
        faceapi.draw.drawDetections(canvas, resizedDetections)
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
        resizedDetections.forEach(result => {
            const {age, gender, genderProbability, expressions} = result
            new faceapi.draw.DrawTextField([
                `${
                    faceapi.utils.round(age, 0)
                } years`,
                `${gender} (${
                    faceapi.utils.round(genderProbability)
                })`,
                `${
                    faceapi.utils.round(expressions.neutral)
                } neutral`,
                `${
                    faceapi.utils.round(expressions.angry)
                } angry`,
                `${
                    faceapi.utils.round(expressions.happy)
                } happy`
            ], result.detection.box.bottomLeft).draw(canvas)
        })

    }, 100)
})

let model;
const classLabels = ["Biodegradable", "Non-Biodegradable"];

async function loadModel() {
    console.log('Loading model...');
    model = await tf.loadLayersModel('/path_to_your_model/model.json');
    console.log('Model loaded.');
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadModel();

    document.getElementById('selectImage').addEventListener('click', function() {
        var fileInput = document.getElementById('file-upload');
        fileInput.click();
    });

    document.getElementById('file-upload').addEventListener('change', function() {
        var file = this.files[0];

        // Display the selected image
        var img = document.getElementById('displayImage');
        img.src = URL.createObjectURL(file);
        img.style.display = 'block';

        img.onload = async function() {
            // Preprocess the image and make predictions
            const predictions = await predict(img);
            displayResult(predictions);
        };
    });

    document.getElementById('realTimeDetection').addEventListener('click', function() {
        startRealTimeDetection();
        // Show the switch camera button
        document.getElementById('switchCamera').style.display = 'block';
    });

    document.getElementById('switchCamera').addEventListener('click', function() {
        useFrontCamera = !useFrontCamera;
        startRealTimeDetection();
    });

    // Initially hide the switch camera button
    document.getElementById('switchCamera').style.display = 'none';
});

async function predict(imageElement) {
    // Preprocess the image
    let tensor = tf.browser.fromPixels(imageElement)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .expandDims();

    tensor = tf.keras.applications.vgg16.preprocessInput(tensor);

    // Make predictions
    const predictions = await model.predict(tensor).data();
    return predictions;
}

function displayResult(predictions) {
    const predictedIndex = predictions.indexOf(Math.max(...predictions));
    const predictedLabel = classLabels[predictedIndex];
    const confidence = (predictions[predictedIndex] * 100).toFixed(2);

    document.getElementById('result').innerHTML = `This is ${predictedLabel}.<br>Confidence: ${confidence}%`;
}

let useFrontCamera = false;

function startRealTimeDetection() {
    var video = document.getElementById('video');

    // Stop the current video stream if it exists
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: useFrontCamera ? 'user' : 'environment' } })
            .then(function(stream) {
                video.srcObject = stream;
                video.play();

                video.style.display = 'block';
                document.getElementById('realTimeResult').style.display = 'block';

                var canvas = document.getElementById('canvas');
                var context = canvas.getContext('2d');

                setInterval(async function() {
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);

                    // Preprocess the image and make predictions
                    const predictions = await predict(canvas);
                    displayResult(predictions);
                }, 2000);
            })
            .catch(function(error) {
                console.error('Error accessing camera:', error);
            });
    } else {
        console.error('getUserMedia is not supported in this browser.');
    }
}

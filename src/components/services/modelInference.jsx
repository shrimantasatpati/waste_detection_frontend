import React, { useState, useRef } from 'react';
import { Camera, Upload, Play, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { inferenceService } from '@/services/inferenceService';

const ModelInference = () => {
  const [selectedModel, setSelectedModel] = useState('');
  const [inputType, setInputType] = useState('image');
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const models = [
    'mobilenet_v3_small_data_aug_imagenet_pretrained',
    'mobilenet_v2_data_aug_imagenet_pretrained',
    'mobilenetv2_data_aug_imagenet_trashbox',
    'mobilenet_v3_large_data_aug_imagenet_pretrained',
    'resnet152_data_aug_imagenet_pretrained',
    'yolo_model'
  ];

  const handleModelSelect = (value) => {
    setSelectedModel(value);
    setError(null);
  };

  const processFile = async (file) => {
    if (!selectedModel) {
      setError('Please select a model first');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await inferenceService.performInference(selectedModel, file);
      setResult(result);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      await processFile(file);
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setError(null);
    } catch (err) {
      setError('Error accessing webcam: ' + err.message);
      console.error('Error accessing webcam:', err);
    }
  };

  const captureImage = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg');
    setPreview(imageData);

    // Convert the data URL to a file
    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      await processFile(file);
    }, 'image/jpeg');

    // Stop the webcam stream
    stopWebcam();
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Model Inference Tool</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select value={selectedModel} onValueChange={handleModelSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={inputType === 'image' ? 'default' : 'outline'}
                onClick={() => setInputType('image')}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Image
              </Button>
              <Button
                variant={inputType === 'video' ? 'default' : 'outline'}
                onClick={() => setInputType('video')}
              >
                <Play className="w-4 h-4 mr-2" />
                Video
              </Button>
              <Button
                variant={inputType === 'webcam' ? 'default' : 'outline'}
                onClick={() => setInputType('webcam')}
              >
                <Camera className="w-4 h-4 mr-2" />
                Webcam
              </Button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            {inputType === 'webcam' ? (
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  autoPlay
                  className="w-full max-h-96 bg-gray-100 rounded-lg"
                />
                <div className="flex gap-2">
                  <Button onClick={startWebcam} disabled={isLoading}>Start Webcam</Button>
                  <Button onClick={captureImage} disabled={isLoading}>Capture</Button>
                  <Button variant="outline" onClick={stopWebcam} disabled={isLoading}>Stop Webcam</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block">
                  <Button asChild disabled={isLoading}>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload {inputType === 'image' ? 'Image' : 'Video'}
                    </span>
                  </Button>
                  <input
                    type="file"
                    className="hidden"
                    accept={inputType === 'image' ? 'image/*' : 'video/*'}
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                </label>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                <p className="mt-2 text-gray-600">Processing...</p>
              </div>
            )}

            {preview && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Preview</h3>
                <img src={preview} alt="Preview" className="max-h-96 rounded-lg" />
              </div>
            )}

            {result && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Results</h3>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
                  {typeof result === 'object' ? JSON.stringify(result, null, 2) : result}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelInference;
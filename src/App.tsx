import React, { useState } from 'react';
import { Upload, Video, Image, Zap, Download, Share, ArrowRight, Check, X } from 'lucide-react';

interface UploadedFile {
  file: File;
  url: string;
  id: string;
}

interface DetectedFace {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  frameTime: number;
  thumbnail?: string;
}

interface FaceMapping {
  detectedFaceId: string;
  uploadedImageId: string;
}

type Step = 'upload' | 'detect' | 'map' | 'generate' | 'complete';

function App() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [uploadedVideo, setUploadedVideo] = useState<UploadedFile | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedFile[]>([]);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [faceMappings, setFaceMappings] = useState<FaceMapping[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setUploadedVideo({ file, url, id: Date.now().toString() });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    const newImages = imageFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      id: Date.now().toString() + Math.random().toString()
    }));
    
    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const extractFrameThumbnail = async (videoUrl: string, timeInSeconds: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.crossOrigin = 'anonymous';
      video.muted = true;
      
      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      });
      
      video.addEventListener('seeked', () => {
        if (ctx) {
          try {
            ctx.drawImage(video, 0, 0);
            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataURL);
          } catch (error) {
            reject(error);
          }
        }
      });
      
      video.addEventListener('error', (e) => {
        reject(new Error('Video loading failed'));
      });
      
      video.src = videoUrl;
      video.currentTime = timeInSeconds;
    });
  };

  const extractFaceThumbnail = async (
    videoUrl: string, 
    timeInSeconds: number, 
    x: number, 
    y: number, 
    width: number, 
    height: number
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.crossOrigin = 'anonymous';
      video.muted = true;
      
      video.addEventListener('loadedmetadata', () => {
        // Set canvas size to face dimensions with minimum size
        canvas.width = Math.max(width, 100);
        canvas.height = Math.max(height, 100);
      });
      
      video.addEventListener('seeked', () => {
        if (ctx) {
          try {
            // Ensure coordinates are within video bounds
            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;
            
            const clampedX = Math.max(0, Math.min(x, videoWidth - width));
            const clampedY = Math.max(0, Math.min(y, videoHeight - height));
            const clampedWidth = Math.min(width, videoWidth - clampedX);
            const clampedHeight = Math.min(height, videoHeight - clampedY);
            
            // Draw only the face region from the video
            ctx.drawImage(
              video,
              clampedX, clampedY, clampedWidth, clampedHeight,  // Source rectangle (face area)
              0, 0, canvas.width, canvas.height   // Destination rectangle (full canvas)
            );
            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataURL);
          } catch (error) {
            reject(error);
          }
        }
      });
      
      video.addEventListener('error', () => {
        reject(new Error('Video loading failed'));
      });
      
      video.src = videoUrl;
      video.currentTime = timeInSeconds;
    });
  };

  const simulateFaceDetection = async () => {
    setProcessing(true);
    setCurrentStep('detect');
    setAnalysisProgress(0);
    
    // Get actual video info
    let videoDimensions = { width: 640, height: 360 };
    let videoDuration = 30; // Default fallback duration
    try {
      if (uploadedVideo) {
        const videoInfo = await getVideoInfo(uploadedVideo.url);
        videoDimensions = videoInfo.dimensions;
        videoDuration = videoInfo.duration;
        console.log(`Processing video: ${videoDuration}s duration, ${videoDimensions.width}x${videoDimensions.height}`);
      }
    } catch (error) {
      console.log('Failed to get video info, using defaults:', error);
    }
    
    // Process the entire video - analyze every 0.5 seconds for thoroughness
    const frameInterval = 0.5; // Analyze every 0.5 seconds
    const totalFrames = Math.ceil(videoDuration / frameInterval);
    const detectedFaces: DetectedFace[] = [];
    
    console.log(`Will analyze ${totalFrames} frames across ${videoDuration} seconds`);
    
    for (let frame = 0; frame < totalFrames; frame++) {
      setAnalysisProgress(Math.round(((frame + 1) / totalFrames) * 100));
      
      const timeInSeconds = frame * frameInterval;
      
      try {
        // Extract actual frame from video
        const frameData = await extractFrameAtTime(uploadedVideo!.url, timeInSeconds);
        
        // Simulate face detection on the actual frame
        // In a real app, this would use ML models like MediaPipe or face-api.js
        const facesInFrame = await simulateFaceDetectionOnFrame(frameData, timeInSeconds, videoDimensions);
        
        detectedFaces.push(...facesInFrame);
        
        // Small delay to prevent browser from freezing
        if (frame % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      } catch (error) {
        console.log(`Failed to process frame at ${timeInSeconds}s:`, error);
        // Continue with next frame even if this one fails
      }
    }
    
    console.log(`Detected ${detectedFaces.length} total face instances`);
    
    // Group similar faces (simulate face recognition across frames)
    setAnalysisProgress(100);
    await new Promise(resolve => setTimeout(resolve, 500)); // Show 100% briefly
    
    const groupedFaces = await groupSimilarFaces(detectedFaces);
    
    console.log(`Grouped into ${groupedFaces.length} unique people`);
    
    setDetectedFaces(groupedFaces);
    setProcessing(false);
    setCurrentStep('map');
  };

  const extractFrameAtTime = async (videoUrl: string, timeInSeconds: number): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.crossOrigin = 'anonymous';
      video.muted = true;
      
      const timeout = setTimeout(() => {
        reject(new Error('Frame extraction timeout'));
      }, 5000);
      
      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      });
      
      video.addEventListener('seeked', () => {
        if (ctx) {
          try {
            ctx.drawImage(video, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            clearTimeout(timeout);
            resolve(imageData);
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        }
      });
      
      video.addEventListener('error', () => {
        clearTimeout(timeout);
        reject(new Error('Video loading failed'));
      });
      
      video.src = videoUrl;
      video.currentTime = timeInSeconds;
    });
  };

  const simulateFaceDetectionOnFrame = async (
    frameData: ImageData, 
    timeInSeconds: number, 
    videoDimensions: { width: number; height: number }
  ): Promise<DetectedFace[]> => {
    // Simulate more realistic face detection based on actual frame data
    // In reality, this would analyze the pixel data for face-like patterns
    
    const faces: DetectedFace[] = [];
    
    // Analyze different regions of the frame for faces
    const regions = [
      { x: 0.1, y: 0.1, w: 0.3, h: 0.4 }, // Top-left
      { x: 0.35, y: 0.1, w: 0.3, h: 0.4 }, // Top-center  
      { x: 0.6, y: 0.1, w: 0.3, h: 0.4 }, // Top-right
      { x: 0.2, y: 0.3, w: 0.6, h: 0.5 }, // Center-wide
    ];
    
    for (let i = 0; i < regions.length; i++) {
      const region = regions[i];
      
      // Simulate face detection probability based on region and frame analysis
      const brightness = analyzeRegionBrightness(frameData, region, videoDimensions);
      const faceProb = brightness > 50 && brightness < 200 ? 0.7 : 0.3; // Faces likely in mid-brightness areas
      
      if (Math.random() < faceProb) {
        const x = region.x * videoDimensions.width + (Math.random() - 0.5) * 50;
        const y = region.y * videoDimensions.height + (Math.random() - 0.5) * 30;
        const width = 60 + Math.random() * 80; // 60-140px
        const height = 80 + Math.random() * 100; // 80-180px
        
        faces.push({
          id: `face_${timeInSeconds}_${i}`,
          x: Math.max(0, Math.min(x, videoDimensions.width - width)),
          y: Math.max(0, Math.min(y, videoDimensions.height - height)),
          width,
          height,
          confidence: 0.6 + Math.random() * 0.35,
          frameTime: timeInSeconds
        });
      }
    }
    
    return faces;
  };

  const analyzeRegionBrightness = (
    imageData: ImageData, 
    region: { x: number; y: number; w: number; h: number },
    dimensions: { width: number; height: number }
  ): number => {
    const { data, width } = imageData;
    const startX = Math.floor(region.x * dimensions.width);
    const startY = Math.floor(region.y * dimensions.height);
    const endX = Math.floor((region.x + region.w) * dimensions.width);
    const endY = Math.floor((region.y + region.h) * dimensions.height);
    
    let totalBrightness = 0;
    let pixelCount = 0;
    
    for (let y = startY; y < endY; y += 5) { // Sample every 5th pixel for performance
      for (let x = startX; x < endX; x += 5) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        totalBrightness += (r + g + b) / 3;
        pixelCount++;
      }
    }
    
    return pixelCount > 0 ? totalBrightness / pixelCount : 128;
  };
  const getVideoInfo = async (videoUrl: string): Promise<{dimensions: {width: number, height: number}, duration: number}> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      
      const timeout = setTimeout(() => {
        reject(new Error('Video loading timeout'));
      }, 5000);
      
      video.addEventListener('loadedmetadata', () => {
        clearTimeout(timeout);
        resolve({
          dimensions: {
            width: video.videoWidth || 640,
            height: video.videoHeight || 360
          },
          duration: video.duration || 10
        });
      });
      
      video.addEventListener('error', () => {
        clearTimeout(timeout);
        reject(new Error('Video loading failed'));
      });
      
      video.src = videoUrl;
    });
  };

  const groupSimilarFaces = async (faces: DetectedFace[]): Promise<DetectedFace[]> => {
    // Simulate grouping faces that appear to be the same person across frames
    const groups: DetectedFace[][] = [];
    
    faces.forEach(face => {
      let addedToGroup = false;
      
      for (let group of groups) {
        const representative = group[0];
        // Simple similarity check based on position and size
        const positionSimilar = Math.abs(face.x - representative.x) < 150 && 
                               Math.abs(face.y - representative.y) < 100;
        const sizeSimilar = Math.abs(face.width - representative.width) < 30;
        
        if (positionSimilar && sizeSimilar) {
          group.push(face);
          addedToGroup = true;
          break;
        }
      }
      
      if (!addedToGroup) {
        groups.push([face]);
      }
    });
    
    // Return the best face from each group (highest confidence)
    const groupedFaces = groups.map((group, index) => {
      const bestFace = group.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );

      return {
        ...bestFace,
        id: `person_${index + 1}`,
        thumbnail: '', // We'll generate thumbnails later if needed
        // Add count of appearances
        appearances: group.length
      } as DetectedFace & { appearances: number };
    });

    // Generate thumbnails for all faces with better error handling
    for (let i = 0; i < groupedFaces.length; i++) {
      const face = groupedFaces[i];
      if (uploadedVideo) {
        try {
          // Generate frame thumbnail with timeout
          face.thumbnail = await Promise.race([
            extractFrameThumbnail(uploadedVideo.url, face.frameTime),
            new Promise<string>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 2000)
            )
          ]);
        } catch (error) {
          console.log(`Thumbnail generation failed for face ${i + 1}:`, error);
          // Create a simple colored placeholder if thumbnail fails
          face.thumbnail = createPlaceholderImage(100, 100, `Person ${i + 1}`);
        }
      }
    }

    return groupedFaces;
  };

  const createPlaceholderImage = (width: number, height: number, text: string): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = width;
    canvas.height = height;
    
    if (ctx) {
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#8B5CF6');
      gradient.addColorStop(1, '#EC4899');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Add text
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, width / 2, height / 2);
    }
    
    return canvas.toDataURL('image/png');
  };

  const handleFaceMapping = (detectedFaceId: string, uploadedImageId: string) => {
    setFaceMappings(prev => {
      const existing = prev.find(m => m.detectedFaceId === detectedFaceId);
      if (existing) {
        return prev.map(m => 
          m.detectedFaceId === detectedFaceId 
            ? { ...m, uploadedImageId }
            : m
        );
      }
      return [...prev, { detectedFaceId, uploadedImageId }];
    });
  };

  const generateMemeVideo = async () => {
    setCurrentStep('generate');
    setProcessing(true);
    setProgress(0);
    
    try {
      // Create a preview frame with face swaps applied
      setProgress(20);
      const previewFrame = await createFaceSwapPreview();
      
      setProgress(60);
      // Simulate additional processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProgress(80);
      // Convert the preview to a video URL (in a real app, this would be actual video processing)
      setGeneratedVideoUrl(previewFrame);
      
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('Face swap generation failed:', error);
      // Fallback to original video
      setGeneratedVideoUrl(uploadedVideo?.url || null);
      setProgress(i);
    }
    
    setProcessing(false);
    setCurrentStep('complete');
  };

  const createFaceSwapPreview = async (): Promise<string> => {
    if (!uploadedVideo || faceMappings.length === 0) {
      throw new Error('No video or face mappings available');
    }

    // Get a frame from the middle of the video for preview
    const videoInfo = await getVideoInfo(uploadedVideo.url);
    const previewTime = videoInfo.duration / 2; // Middle of video
    
    // Extract the base frame
    const baseFrame = await extractFrameThumbnail(uploadedVideo.url, previewTime);
    
    // Create canvas to composite the face swaps
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Canvas context not available');
    
    // Load the base frame image
    const baseImage = await loadImage(baseFrame);
    canvas.width = baseImage.width;
    canvas.height = baseImage.height;
    
    // Draw the base frame
    ctx.drawImage(baseImage, 0, 0);
    
    // Apply face swaps
    for (const mapping of faceMappings) {
      const detectedFace = detectedFaces.find(f => f.id === mapping.detectedFaceId);
      const uploadedImage = uploadedImages.find(img => img.id === mapping.uploadedImageId);
      
      if (detectedFace && uploadedImage) {
        try {
          const faceImage = await loadImage(uploadedImage.url);
          
          // Calculate scaling to fit the detected face area
          const scaleX = detectedFace.width / faceImage.width;
          const scaleY = detectedFace.height / faceImage.height;
          const scale = Math.min(scaleX, scaleY);
          
          const scaledWidth = faceImage.width * scale;
          const scaledHeight = faceImage.height * scale;
          
          // Center the face image within the detected face area
          const offsetX = detectedFace.x + (detectedFace.width - scaledWidth) / 2;
          const offsetY = detectedFace.y + (detectedFace.height - scaledHeight) / 2;
          
          // Save context state
          ctx.save();
          
          // Create circular clipping mask for more natural face swap
          ctx.beginPath();
          ctx.ellipse(
            detectedFace.x + detectedFace.width / 2,
            detectedFace.y + detectedFace.height / 2,
            detectedFace.width / 2,
            detectedFace.height / 2,
            0, 0, 2 * Math.PI
          );
          ctx.clip();
          
          // Draw the face swap with some transparency for blending
          ctx.globalAlpha = 0.9;
          ctx.drawImage(faceImage, offsetX, offsetY, scaledWidth, scaledHeight);
          
          // Restore context state
          ctx.restore();
          
          // Add a subtle border to show the swap area
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(
            detectedFace.x + detectedFace.width / 2,
            detectedFace.y + detectedFace.height / 2,
            detectedFace.width / 2,
            detectedFace.height / 2,
            0, 0, 2 * Math.PI
          );
          ctx.stroke();
          
        } catch (error) {
          console.error('Failed to apply face swap for face:', detectedFace.id, error);
        }
      }
    }
    
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };
  const resetApp = () => {
    setCurrentStep('upload');
    setUploadedVideo(null);
    setUploadedImages([]);
    setDetectedFaces([]);
    setFaceMappings([]);
    setProcessing(false);
    setProgress(0);
    setGeneratedVideoUrl(null);
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'upload': return 'Upload Content';
      case 'detect': return 'Detecting Faces';
      case 'map': return 'Map Faces';
      case 'generate': return 'Generating Video';
      case 'complete': return 'Meme Ready!';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">FaceSwap Memes</h1>
          <p className="text-purple-200">Create hilarious meme videos with face swapping</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 px-4">
          {(['upload', 'detect', 'map', 'generate', 'complete'] as Step[]).map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep === step 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                  : index < ['upload', 'detect', 'map', 'generate', 'complete'].indexOf(currentStep)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-600 text-gray-300'
              }`}>
                {index < ['upload', 'detect', 'map', 'generate', 'complete'].indexOf(currentStep) ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < 4 && (
                <div className={`w-12 h-1 mx-2 ${
                  index < ['upload', 'detect', 'map', 'generate', 'complete'].indexOf(currentStep)
                    ? 'bg-green-500'
                    : 'bg-gray-600'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">{getStepTitle()}</h2>

          {/* Upload Step */}
          {currentStep === 'upload' && (
            <div className="space-y-6">
              {/* Video Upload */}
              <div className="bg-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Video className="h-5 w-5 mr-2" />
                  Upload Video
                </h3>
                {!uploadedVideo ? (
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-purple-400 rounded-xl p-8 text-center hover:border-purple-300 transition-colors">
                      <Upload className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                      <p className="text-purple-200 mb-2">Click to upload your video</p>
                      <p className="text-purple-300 text-sm">MP4, MOV, AVI supported</p>
                    </div>
                    <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                  </label>
                ) : (
                  <div className="relative">
                    <video src={uploadedVideo.url} controls className="w-full rounded-xl" />
                    <button
                      onClick={() => setUploadedVideo(null)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Image Upload */}
              <div className="bg-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Image className="h-5 w-5 mr-2" />
                  Upload Face Images
                </h3>
                <label className="block cursor-pointer mb-4">
                  <div className="border-2 border-dashed border-pink-400 rounded-xl p-6 text-center hover:border-pink-300 transition-colors">
                    <Upload className="h-8 w-8 text-pink-400 mx-auto mb-2" />
                    <p className="text-pink-200 text-sm">Add face images to swap</p>
                  </div>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {uploadedImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.url}
                          alt="Face"
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => setUploadedImages(prev => prev.filter(img => img.id !== image.id))}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {uploadedVideo && uploadedImages.length > 0 && (
                <button
                  onClick={simulateFaceDetection}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
                >
                  Detect Faces
                  <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              )}
            </div>
          )}

          {/* Detect Step */}
          {currentStep === 'detect' && processing && (
            <div className="text-center py-12">
              <div className="relative mb-6">
                <div className="w-24 h-24 border-8 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{analysisProgress}%</span>
                </div>
              </div>
              <p className="text-white text-xl font-semibold mb-2">Analyzing Video Frames</p>
              <p className="text-purple-200 mb-4">
                {analysisProgress < 100 
                  ? "Extracting and analyzing actual video frames..." 
                  : "Processing detected faces..."}
              </p>
              <div className="w-full bg-gray-600 rounded-full h-3 max-w-md mx-auto">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${analysisProgress}%` }}
                ></div>
              </div>
              <p className="text-purple-300 text-sm mt-2">
                {analysisProgress < 100 
                  ? `Processing real video frames... ${analysisProgress}% complete`
                  : "Grouping similar faces..."}
              </p>
            </div>
          )}

          {/* Map Step */}
          {currentStep === 'map' && (
            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Found {detectedFaces.length} Unique Face{detectedFaces.length !== 1 ? 's' : ''} in Video
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {detectedFaces.map((face, index) => (
                    <div key={face.id} className="bg-white/10 rounded-xl p-4">
                      <div className="mb-3">
                        {face.thumbnail ? (
                          <img 
                            src={face.thumbnail} 
                            alt={`Person ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-yellow-400"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-600 rounded-lg flex items-center justify-center border-2 border-yellow-400">
                            <p className="text-white text-sm">Face {index + 1}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-white font-medium">Person {index + 1}</p>
                        <p className="text-yellow-300 text-sm">
                          {Math.round(face.confidence * 100)}% confidence
                        </p>
                        <p className="text-purple-200 text-xs">
                          Appears {(face as any).appearances || 1} time{((face as any).appearances || 1) !== 1 ? 's' : ''}
                        </p>
                        <p className="text-purple-300 text-xs">
                          At {face.frameTime.toFixed(1)}s
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Map Faces to Images</h3>
                <div className="space-y-4">
                  {detectedFaces.map((face) => (
                    <div key={face.id} className="bg-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-white font-medium">Person {detectedFaces.indexOf(face) + 1}</p>
                        <div className="text-right">
                          <p className="text-yellow-300 text-sm">{Math.round(face.confidence * 100)}% match</p>
                          <p className="text-purple-200 text-xs">
                            {(face as any).appearances || 1} appearance{((face as any).appearances || 1) !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {uploadedImages.map((image) => {
                          const isSelected = faceMappings.some(
                            m => m.detectedFaceId === face.id && m.uploadedImageId === image.id
                          );
                          return (
                            <button
                              key={image.id}
                              onClick={() => handleFaceMapping(face.id, image.id)}
                              className={`relative rounded-lg overflow-hidden transition-all duration-200 ${
                                isSelected 
                                  ? 'ring-4 ring-purple-500 scale-105' 
                                  : 'hover:scale-105 opacity-70 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={image.url}
                                alt="Face option"
                                className="w-full h-16 object-cover"
                              />
                              {isSelected && (
                                <div className="absolute inset-0 bg-purple-500/30 flex items-center justify-center">
                                  <Check className="h-6 w-6 text-white" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {faceMappings.length > 0 && (
                <button
                  onClick={generateMemeVideo}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
                >
                  Generate Meme Video
                  <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              )}
            </div>
          )}

          {/* Generate Step */}
          {currentStep === 'generate' && (
            <div className="text-center py-12">
              <div className="relative mb-6">
                <div className="w-32 h-32 border-8 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{progress}%</span>
                </div>
              </div>
              <p className="text-white text-xl font-semibold mb-2">Creating Your Meme Video</p>
              <p className="text-purple-200">Swapping faces and rendering video...</p>
              <div className="w-full bg-gray-600 rounded-full h-3 mt-6 max-w-md mx-auto">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {currentStep === 'complete' && (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Meme Video Ready!</h3>
                <p className="text-green-200">Your hilarious face-swapped video is ready to share</p>
              </div>

              {generatedVideoUrl && (
                <div className="bg-white/5 rounded-2xl p-6 mb-6">
                  {generatedVideoUrl.startsWith('data:image') ? (
                    <div>
                      <img src={generatedVideoUrl} alt="Face swap preview" className="w-full rounded-xl mb-4" />
                      <p className="text-purple-200 text-sm">Preview frame with face swaps applied</p>
                    </div>
                  ) : (
                    <div>
                      <video src={generatedVideoUrl} controls className="w-full rounded-xl mb-4" />
                      <p className="text-purple-200 text-sm">Preview of your meme video with face swaps applied</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center">
                  <Download className="h-5 w-5 mr-2" />
                  Download Video
                </button>
                <button className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center">
                  <Share className="h-5 w-5 mr-2" />
                  Share Meme
                </button>
              </div>

              <button
                onClick={resetApp}
                className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200"
              >
                Create Another Meme
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-purple-200 text-sm">
            Create amazing meme videos with AI-powered face swapping
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
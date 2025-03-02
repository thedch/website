# TODO: Add uv

import cv2
import numpy as np
import onnxruntime
import argparse
from pathlib import Path

def preprocess_image(img_path, input_size=(640, 640)):
    # Read image
    img = cv2.imread(img_path)
    original_shape = img.shape[:2]  # (height, width)

    # Resize
    img = cv2.resize(img, input_size)

    # Convert to float32, normalize to [0,1], transpose to CHW
    img = img.astype(np.float32) / 255.0
    img = img.transpose(2, 0, 1)  # HWC -> CHW

    # Add batch dimension
    img = np.expand_dims(img, 0)
    return img, original_shape

def process_output(output, conf_threshold=0.25, input_shape=(640, 640), original_shape=None):
    outputs = output[0]  # First output from model

    # Get predictions
    predictions = outputs.squeeze().T  # Transpose to get [num_boxes, num_classes+5]

    # Filter by confidence
    scores = np.max(predictions[:, 4:], axis=1)
    predictions = predictions[scores > conf_threshold]
    scores = scores[scores > conf_threshold]

    if len(scores) == 0:
        return []

    # Get class labels
    class_ids = np.argmax(predictions[:, 4:], axis=1)

    # Get bounding boxes
    boxes = predictions[:, :4]

    # Convert from xywh to xyxy
    boxes = np.array([
        boxes[:, 0] - boxes[:, 2] / 2,  # x1
        boxes[:, 1] - boxes[:, 3] / 2,  # y1
        boxes[:, 0] + boxes[:, 2] / 2,  # x2
        boxes[:, 1] + boxes[:, 3] / 2,  # y2
    ]).T

    # Scale boxes to original image size
    if original_shape is not None:
        scale_y = original_shape[0] / input_shape[0]
        scale_x = original_shape[1] / input_shape[1]
        boxes[:, [0, 2]] *= scale_x
        boxes[:, [1, 3]] *= scale_y

    return boxes, scores, class_ids

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('image_path', type=str, help='Path to input image')
    parser.add_argument('model_path', type=str, help='Path to ONNX model')
    args = parser.parse_args()

    # Load model
    session = onnxruntime.InferenceSession(args.model_path, providers=['CPUExecutionProvider'])

    # Preprocess image
    img_path = args.image_path
    input_data, original_shape = preprocess_image(img_path)

    # Run inference
    outputs = session.run(None, {'images': input_data})

    # Process detections
    boxes, scores, class_ids = process_output(outputs, original_shape=original_shape)

    # Draw results
    img = cv2.imread(img_path)
    for box, score, class_id in zip(boxes, scores, class_ids):
        x1, y1, x2, y2 = box.astype(int)
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
        label = f'Class {class_id}: {score:.2f}'
        cv2.putText(img, label, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    # Save and show result
    output_path = str(Path(img_path).with_name('output.jpg'))
    cv2.imwrite(output_path, img)
    print(f"Output saved to {output_path}")

if __name__ == "__main__":
    main()
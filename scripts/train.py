import torch
from torch import nn
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from torch.optim.sgd import SGD
import torch.nn.functional as F
from pathlib import Path

THIS_DIR = Path(__file__).parent

class MnistModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels=1, out_channels=1, kernel_size=3, padding=1, stride=2)
        self.conv2 = nn.Conv2d(in_channels=1, out_channels=1, kernel_size=3, padding=1, stride=2)
        self.fc1 = nn.Linear(1 * 7 * 7, 10)

    def forward(self, xb):
        xb = F.relu(self.conv1(xb))
        xb = F.relu(self.conv2(xb))
        xb = xb.view(-1, 1 * 7 * 7)
        xb = self.fc1(xb)
        return xb

def main():
    transform = transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.1307,), (0.3081,))])
    trainset = datasets.MNIST('data', train=True, download=True, transform=transform)

    trainloader = DataLoader(trainset, batch_size=32, shuffle=True)
    model = MnistModel()
    optimizer = SGD(model.parameters(), lr=0.01)
    criterion = nn.CrossEntropyLoss()

    for epoch in range(3):
        for i, (data, target) in enumerate(trainloader):

            optimizer.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()
            if i % 100 == 0:
                print(f'Epoch {epoch+1}, Step {i+1}, Loss: {loss.item():.4f}')

    # Export to ONNX
    dummy_input = torch.randn(1, 1, 28, 28)
    torch.onnx.export(
        model,
        dummy_input,
        str(THIS_DIR / 'mnist_model.onnx'),
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )


if __name__ == "__main__":
    main()
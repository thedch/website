import argparse
import torch
from torch import nn
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from torch.optim.adam import Adam
import torch.nn.functional as F
from pathlib import Path

THIS_DIR = Path(__file__).parent

class MnistModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels=1, out_channels=32, kernel_size=3, padding=1, stride=2)  # 28x28 -> 14x14
        self.conv2 = nn.Conv2d(in_channels=32, out_channels=64, kernel_size=3, padding=1, stride=2)  # 14x14 -> 7x7
        self.fc1 = nn.Linear(64 * 7 * 7, 128)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, xb):
        xb = F.relu(self.conv1(xb))
        xb = F.relu(self.conv2(xb))
        xb = xb.view(-1, 64 * 7 * 7)
        xb = F.relu(self.fc1(xb))
        xb = self.fc2(xb)
        return xb

def main(n_epochs: int):
    trainset = datasets.MNIST('mnist_dataset', train=True, download=True, transform=transforms.ToTensor())
    valset = datasets.MNIST('mnist_dataset', train=False, download=True, transform=transforms.ToTensor())

    trainloader = DataLoader(trainset, batch_size=32, shuffle=True)
    valloader = DataLoader(valset, batch_size=32, shuffle=False)
    model = MnistModel()
    optimizer = Adam(model.parameters(), lr=1e-3)
    criterion = nn.CrossEntropyLoss()

    for epoch in range(n_epochs):
        model.train()
        for i, (data, target) in enumerate(trainloader):
            optimizer.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()
            if i % 250 == 0:
                print(f'Epoch {epoch+1}, Step {i+1}, Loss: {loss.item():.4f}')

        model.eval()
        val_loss = 0
        correct = 0
        total = 0
        with torch.no_grad():
            for data, target in valloader:
                output = model(data)
                val_loss += criterion(output, target).item()
                pred = output.argmax(dim=1)
                correct += (pred == target).sum().item()
                total += target.size(0)

        val_loss /= len(valloader)
        accuracy = 100. * correct / total
        print(f'End of epoch {epoch+1} - validation loss: {val_loss:.4f}, accuracy: {accuracy:.2f}%')

    if not input('Export to ONNX? (y/n) ').lower() == 'y':
        return

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
    parser = argparse.ArgumentParser()
    parser.add_argument('--n-epochs', type=int, required=True)
    main(**vars(parser.parse_args()))

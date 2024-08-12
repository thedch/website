---
title: "Adventures with Langchain"
description: "Let's build a simple Siri!"
date: "2023-01-23"
draft: false
---

## Introduction

There’s this fun library that I’ve seen on Twitter called [LangChain](https://www.langchain.com/). I wanted to take it for a spin and see if I could build some little fun thing with it – let’s see how it goes!

Let’s start out with some boilerplate HuggingFace code, this is often useful when debugging:

```python
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-large")
tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-large")

inputs = tokenizer("how tall is barack obama", return_tensors="pt")
outputs = model.generate(**inputs)
print(tokenizer.batch_decode(outputs, skip_special_tokens=True))

# Output:
# ['1.8 m']
```

## Audio -> Text

When chaining together LLMs, one obvious thing that comes to mind is modality-transition – or concretely, transitioning from audio -> text, and maybe even audio -> text -> image -> video (speak a movie into existence!)

I know Whisper is popular for Audio -> Text, so let’s try to get that running:

```python
from pathlib import Path
import whisper

model = whisper.load_model("base")
result = model.transcribe(str(Path.home() / 'Downloads/testing.m4a'))
print(result["text"])

# Output:
# My name is Daniel. I live in California. I like to travel.
```

Cool – using the whisper library is quite easy! I tried to use the [HuggingFace Whisper model](https://huggingface.co/docs/transformers/model_doc/whisper), but ran into the following error:

```
MemoryError: Cannot allocate write+execute memory for ffi.callback().
You might be running on a system that prevents this. For more information, see
https://cffi.readthedocs.io/en/latest/using.html#callbacks
```

Possibly due to running locally on MacOS? I googled around for a bit and decided to just go with the Whisper library, as it worked out of the box, no need to fight with FFI issues.

Now, let’s figure out how to record audio from a Jupyter Notebook. This is a bit clunky but not hard:

```python
from ipywebrtc import AudioRecorder, CameraStream
import torchaudio
from IPython.display import Audio

camera = CameraStream(constraints={'audio': True, 'video': False})
recorder = AudioRecorder(stream=camera)
```

## LangChain

Now, let’s bring in LangChain. They already have strong support for OpenAI and HuggingFace which is great, but I need a way to use the locally running Whisper model. Thankfully, I can add a new primitive and as long as I define the input_keys, output_keys, and a _call method, LangChain will happily accept it as part of a SequentialChain!

```python
from more_itertools import one
from typing import List, Dict

import whisper
from langchain.chains.base import Chain

class AudioToTextChain(Chain):
    MODEL = whisper.load_model("base")

    def _call(self, inputs: Dict[str, str]) -> Dict[str, str]:
        result = self.MODEL.transcribe(inputs[one(self.input_keys)], fp16=False)
        return {one(self.output_keys): result['text']}

    @property
    def input_keys(self) -> List[str]:
        return ['audio_fname']

    @property
    def output_keys(self) -> List[str]:
        return ['transcription']

transcription_chain = AudioToTextChain()
```

Okay, we have the Audio -> Text setup, now let’s use a small FLAN model to answer questions as a virtual assistant to create a dumber version of Siri!

This runs locally on my MacBook in a couple seconds, which isn’t too bad – but it doesn’t have any internet access. Maybe I’ll add that as a second step.

```python
from langchain.chains import SequentialChain
from langchain import (
    PromptTemplate,
    HuggingFacePipeline,
    LLMChain,
)

template = """You are a virtual assistant. Given a request, answer it to the best of your abilities.

Request:
{transcription}
Answer:"""

siri_chain = LLMChain(
    llm=HuggingFacePipeline.from_model_id('google/flan-t5-large', task='text2text-generation'),
    prompt=PromptTemplate(input_variables=["transcription"], template=template),
    output_key="answer",
)

overall_chain = SequentialChain(
    chains=[transcription_chain, siri_chain],
    input_variables=["audio_fname"],
    # Here we return multiple variables:
    output_variables=["transcription", "answer"],
    verbose=True,
)
```

## Putting it all together

Okay, now let’s run it! First, we record some audio, and then save it as recording.webm, which we feed in as the input to the SequentialChain, which is then transcribed by Whisper, and then processed by FLAN!

```python
from ipywebrtc import AudioRecorder, CameraStream

camera = CameraStream(constraints={'audio': True, 'video': False})
recorder = AudioRecorder(stream=camera)

with open('recording.webm', 'wb') as f:
    f.write(recorder.audio.value)

review = overall_chain({"audio_fname": "recording.webm"})


> Entering new SequentialChain chain...
Chain 0:
{'transcription': " What's the best place to go surfing in Australia?"}

Chain 1:
{'answer': 'The Gold Coast'}


> Finished chain.
```

There we go! Using the LangChain library and a few off the shelf models, we can create a little virtual assistant that runs locally and can answer all sorts of trivia questions!

TODO:

- Host it somewhere so I can ask it questions all day when I’m out
- Train it on all my documents and data so it knows me
- Connect it to all my applications / calendar / etc so it can take actions on my behalf when I ask it to
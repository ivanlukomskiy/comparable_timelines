import hashlib
import json
import os

import yaml
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI()

responses_folder = "response-cache"
requests_folder = "requests"

def answer(prompt):
    return client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            # {"role": "system", "content": "You are a helpful assistant."},
            {
                "role": "user",
                "content": prompt
            }
        ]
    ).choices[0].message.content

def query(prompt):
    hash_object = hashlib.md5(prompt.encode()).hexdigest()
    path = f"{responses_folder}/{hash_object}.txt"
    if os.path.exists(path):
        with open(path, "r") as file:
            return file.read()
    print('re-generating response')
    response = answer(prompt)
    with open(path, "w") as file:
        file.write(response)
    return response


if __name__ == '__main__':
    exploration = dict()

    with open("prompts/exploration.txt", "r") as file:
        high_scale_prompt = file.read()
    with open("prompts/exploration-detailed.txt", "r") as file:
        events_prompt = file.read()
    high_scale_yaml = query(high_scale_prompt)
    periods = yaml.safe_load(high_scale_yaml)
    for period in periods['periods']:
        prompt = (events_prompt
                  .replace("$period", period['title'])
                  .replace("$centuries", period['time']))
        events_yaml = query(prompt)
        events_src = yaml.safe_load(events_yaml)['events']
        events = []
        for event in events_src:
            e = {
                'title': event['title'],
                'timeStart': str(event.get('timeStart')),
                'precision': str(event.get('precision')),
            }
            if 'timeEnd' in event:
                e['timeEnd'] = str(event.get('timeEnd'))
            events.append(e)
        exploration[period['title']] = events

    with open("exploration.json", "w") as json_file:
        print(exploration)
        json.dump(exploration, json_file, indent=4)



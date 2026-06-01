---
title: "Jack's Magic Bean"
slug: jacks-magic-bean
summary: "A 3D platformer built around a custom controller, letting players explore the sky by planting and climbing a magic beanstalk."
dateStart: "2024.11"
dateEnd: "2025.5"
tags: ["Personal Project"]
featured: true
---

Jack's Magic Bean is a 3D platformer built around a motion controller, letting players explore the sky by planting and climbing a magic beanstalk.

The controller is equipped with a gyroscope and pressure sensors, allowing players to guide vine growth by tilting the device and simulate climbing by pressing certain actions on sensor-wrapped pedals.

**Time:** 2024.11.3 – 2025.5.30  
**Role:** Programmer, Designer, Hardware Developer  
**Tools:** Unity · Visual Studio Code · Arduino · Blender

## Gameplay Demonstration

<div class="video-embed">
  <iframe
    src="https://www.youtube.com/embed/QoHOm0p-hrk"
    title="Jack's Magic Bean gameplay"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
  ></iframe>
</div>

## What did I do?

### Make the Controller

I built a custom hardware controller using an Arduino and 3D-printed components.

The hardware setup uses an Arduino board with a gyroscope and a pair of pressure sensors.

Then I made a simple hand-holding model with Blender as the casing for the main board.

I also built two external pedals with spange pads and silicone pads, wrapping the pressure sensors.

### Make the Game

I wanted the whole experience to focus on climbing, so the core mechanic is simple: plant the bean, then climb.

The vine is procedurally generated, and the leaves act as platforms.

Collect drops, water the magic vine, then climb higher.

Attacking seagulls serve as obstacles.

### Testing out!

I went through several rounds of testing and iterations.

Most of the work went into tuning the hardware signals and refining the pedal structure.

It's hard to choose the right materials and design to make the pressure sensors respond accurately.

The outer foam board provides stability, while a small layer of hard silicone inside ensures the pressure sensors work reliably.

### Future Plan

I plan to merge the hand and foot controls into one full-body setup.

For gameplay, I want to add more ways to shape the vine and create different climbing paths.

Also, add more challenges, such as a weather system or adjustable-resistance pedals.

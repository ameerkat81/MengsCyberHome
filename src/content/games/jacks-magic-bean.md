---
title: "Jack's Magic Bean"
slug: jacks-magic-bean
summary: "A 3D platformer built around a custom controller, letting players explore the sky by planting and climbing a magic beanstalk."
dateStart: "2024.11"
dateEnd: "2025.5"
tags: ["Personal Project"]
featured: true
heroImage: "/images/games/jacks-magic-bean/hero.jpg"
intro:
  - "Jack's Magic Bean is a 3D platformer built around a motion controller, letting players explore the sky by planting and climbing a magic beanstalk."
  - "The controller is equipped with a gyroscope and pressure sensors, allowing players to guide vine growth by tilting the device and simulate climbing by pressing certain actions on sensor-wrapped pedals."
projectMeta:
  time: "2024.11.3 – 2025.5.30"
  role: "Programmer, Designer, Hardware Developer"
  tools: "Unity · Visual Studio Code · Arduino · Blender"
---

## Gameplay Demonstration

<div class="video-embed">
  <iframe
    src="https://www.youtube.com/embed/QoHOm0p-hrk"
    title="Jack's Magic Bean gameplay"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
  ></iframe>
</div>

## Gallery

<div class="image-gallery">
  <div class="image-gallery__row image-gallery__row--1-1">
    <img src="/images/games/jacks-magic-bean/01.png" alt="" />
    <img src="/images/games/jacks-magic-bean/02.png" alt="" />
  </div>
  <div class="image-gallery__row image-gallery__row--1-1">
    <img src="/images/games/jacks-magic-bean/03.png" alt="" />
    <img src="/images/games/jacks-magic-bean/04.png" alt="" />
  </div>
  <div class="image-gallery__row image-gallery__row--1">
    <img src="/images/games/jacks-magic-bean/05.png" alt="" />
  </div>
  <div class="image-gallery__row image-gallery__row--1">
    <img src="/images/games/jacks-magic-bean/06.png" alt="" />
  </div>
  <div class="image-gallery__row image-gallery__row--15-05">
    <img src="/images/games/jacks-magic-bean/07.png" alt="" />
    <img src="/images/games/jacks-magic-bean/08.png" alt="" />
  </div>
  <div class="image-gallery__row image-gallery__row--11-09">
    <img src="/images/games/jacks-magic-bean/09.png" alt="" />
    <img src="/images/games/jacks-magic-bean/10.png" alt="" />
  </div>
</div>

## What did I do?

<div class="subsection">
  <div class="subsection__aside">
    <h3 class="subsection__title">Make the Controller</h3>
    <div class="subsection__text">
      <p>I built a custom hardware controller using an Arduino and 3D-printed components.</p>
      <p>The hardware setup uses an Arduino board with a gyroscope and a pair of pressure sensors.</p>
      <p>Then I made a simple hand-holding model with Blender as the casing for the main board.</p>
      <p>I also built two external pedals with spange pads and silicone pads, wrapping the pressure sensors.</p>
    </div>
  </div>
  <div class="subsection__media">
    <div class="image-row image-row--square">
      <img src="/images/games/jacks-magic-bean/11.png" alt="Hardware assembly" />
      <img src="/images/games/jacks-magic-bean/12.png" alt="Circuit board" />
      <img src="/images/games/jacks-magic-bean/13.png" alt="Pedals" />
    </div>
  </div>
</div>

<div class="subsection make-game">
  <div class="subsection__aside">
    <h3 class="subsection__title">Make the Game</h3>
    <img
      class="make-game__figure"
      src="/images/games/jacks-magic-bean/17.png"
      alt="Gameplay"
    />
  </div>
  <div class="subsection__media">
    <div class="image-row image-row--square">
      <img src="/images/games/jacks-magic-bean/14.png" alt="Gameplay" />
      <img src="/images/games/jacks-magic-bean/15.png" alt="Gameplay" />
      <img src="/images/games/jacks-magic-bean/16.png" alt="Gameplay" />
    </div>
    <div class="subsection__text make-game__text">
      <p>I wanted the whole experience to focus on climbing, so the core mechanic is simple: plant the bean, then climb.</p>
      <p>The vine is procedurally generated, and the leaves act as platforms.</p>
      <p>Collect drops, water the magic vine, then climb higher.</p>
      <p>Attacking seagulls serve as obstacles.</p>
    </div>
  </div>
</div>

<div class="subsection">
  <div class="subsection__aside">
    <h3 class="subsection__title">Testing out!</h3>
    <div class="subsection__text">
      <p>I went through several rounds of testing and iterations.</p>
      <p>Most of the work went into tuning the hardware signals and refining the pedal structure.</p>
      <p>It's hard to choose the right materials and design to make the pressure sensors respond accurately.</p>
      <p>The outer foam board provides stability, while a small layer of hard silicone inside ensures the pressure sensors work reliably.</p>
    </div>
  </div>
  <div class="subsection__media">
    <div class="image-row image-row--testing">
      <img src="/images/games/jacks-magic-bean/18.jpg" alt="Testing iteration" />
      <img src="/images/games/jacks-magic-bean/19.jpg" alt="Testing iteration" />
      <img src="/images/games/jacks-magic-bean/20.jpg" alt="Testing setup" />
    </div>
  </div>
</div>

<div class="subsection">
  <div class="subsection__aside">
    <h3 class="subsection__title">Future Plan</h3>
    <div class="subsection__text">
      <p>I plan to merge the hand and foot controls into one full-body setup.</p>
      <p>For gameplay, I want to add more ways to shape the vine and create different climbing paths.</p>
      <p>Also, add more challenges, such as a weather system or adjustable-resistance pedals.</p>
    </div>
  </div>
  <div class="subsection__media">
    <img
      class="subsection__figure"
      src="/images/games/jacks-magic-bean/21.jpg"
      alt="Future plan sketch"
    />
  </div>
</div>

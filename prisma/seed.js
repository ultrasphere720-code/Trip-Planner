const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seed() {
  const count = await prisma.trip.count();
  if (count > 0) {
    console.log('Database already has trips, count:', count);
    return;
  }

  const hashedPassword = await bcrypt.hash('travelpass123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'explorer@orbit.travel' },
    update: {},
    create: {
      name: 'Global Explorer',
      email: 'explorer@orbit.travel',
      password: hashedPassword,
    },
  });

  const sampleDays = [
    {
      dayNumber: 1,
      date: '2026-10-01',
      theme: 'Arrival & Gion Lanterns Heritage',
      morning: {
        activity: 'Check-in to Machiya boutique townhouse near Shirakawa canal',
        location: 'Shirakawa District, Kyoto',
        estimatedCost: 280,
      },
      afternoon: {
        activity: 'Stroll through historic Hanami-koji and tea tasting ceremony',
        location: 'Gion Historic Quarter',
        estimatedCost: 65,
      },
      evening: {
        activity: 'Illuminated twilight walk through Yasaka Shrine and Kamo riverbank',
        location: 'Yasaka-jinja, Higashiyama',
        estimatedCost: 30,
      },
      meals: {
        breakfast: 'Kyoto matcha roll & drip coffee at Inoda Coffee',
        lunch: 'Traditional Kaiseki seasonal bento near Yasaka',
        dinner: 'Charcoal-grilled Yakitori and local sake in Pontocho alley',
      },
    },
    {
      dayNumber: 2,
      date: '2026-10-02',
      theme: 'Emerald Bamboo & Mountain Shrines',
      morning: {
        activity: 'Early morning bamboo grove walk and Tenryu-ji Zen garden contemplation',
        location: 'Arashiyama Bamboo Forest',
        estimatedCost: 45,
      },
      afternoon: {
        activity: 'Scenic traditional Hozugawa riverboat ride surrounded by cedar mountains',
        location: 'Hozugawa Valley, Kameoka to Arashiyama',
        estimatedCost: 85,
      },
      evening: {
        activity: 'Explore Kimono Forest lanterns and Arashiyama Moon Crossing Bridge',
        location: 'Togetsukyo Bridge',
        estimatedCost: 25,
      },
      meals: {
        breakfast: 'Freshly baked tofu donuts and soy milk latte in Arashiyama',
        lunch: 'Handmade Yudofu (hot tofu cuisine) overlooking bamboo gardens',
        dinner: 'Soba noodles with crispy tempura in historic Arashiyama cottage',
      },
    },
    {
      dayNumber: 3,
      date: '2026-10-03',
      theme: 'Torii Gates & Golden Zen Reflections',
      morning: {
        activity: 'Hike through 10,000 vermilion Torii gates up Mount Inari before crowds',
        location: 'Fushimi Inari Taisha',
        estimatedCost: 20,
      },
      afternoon: {
        activity: 'Marvel at the gold leaf pavilion reflected in the mirror pond',
        location: 'Kinkaku-ji (Golden Pavilion)',
        estimatedCost: 50,
      },
      evening: {
        activity: 'Panoramic city sunset from wooden stage of cliffside ancient temple',
        location: 'Kiyomizu-dera Temple',
        estimatedCost: 40,
      },
      meals: {
        breakfast: 'Inari sushi and roasted hojicha tea at shrine foot',
        lunch: 'Artisanal Kyoto ramen with rich chicken paitan broth',
        dinner: 'Wagyu sukiyaki hotpot experience in downtown Nakagyo',
      },
    }
  ];

  const trip = await prisma.trip.create({
    data: {
      userId: user.id,
      origin: 'New York, USA',
      destination: 'Kyoto, Japan',
      budget: 3500,
      currency: '$',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-10-05'),
      totalDays: 5,
      preferences: 'Culture, historic temples, culinary specialties, photography',
      itinerary: JSON.stringify({
        destination: 'Kyoto, Japan',
        totalDays: 3,
        totalEstimatedCost: 2950,
        days: sampleDays,
      }),
      status: 'FINALIZED',
      totalEstimatedCost: 2950,
    },
  });

  console.log('Seeded sample trip successfully! Trip ID:', trip.id);
}

seed().catch(console.error).finally(() => prisma.$disconnect());

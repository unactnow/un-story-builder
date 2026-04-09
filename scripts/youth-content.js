/**
 * Canonical Youth feature story + timeline (hero, body copy, and sample photo-essay blocks).
 * Replace image URLs with production assets when publishing.
 */

module.exports = {
  featureStory: {
    title: 'Youth Have Always Moved History',
  },
  storyBlocks: [
    {
      blockType: 'hero_video',
      sortOrder: 0,
      heading: 'Youth Have Always Moved History',
      subheading:
        'From lunch counters to climate strikes, young people have shaped the course of peace and justice worldwide.',
      videoUrl: 'https://www.un.org/sites/un2.un.org/files/sample-video.mp4',
      imageCaption: 'Video credit goes here',
    },
    {
      blockType: 'text_body',
      sortOrder: 1,
      bodyText:
        'Across generations, young organizers have turned moral clarity into collective action: sit-ins that spread across the American South, student uprisings that challenged apartheid, and school strikes that put climate justice on the agenda of world leaders. This story is a glimpse of that arc — not an exhaustive history, but a reminder that youth leadership is not new; it is a through-line in the struggle for dignity and peace.',
    },
    {
      blockType: 'divider',
      sortOrder: 2,
      heading: 'Moments along the way',
    },
    {
      blockType: 'split_image_left',
      sortOrder: 3,
      heading: 'Civil rights and courage at the counter',
      bodyText:
        'In 1960, four students in Greensboro, North Carolina, refused to leave a segregated lunch counter. Their disciplined, nonviolent protest inspired thousands of similar actions — a textbook example of how young people can shift what a society considers possible.',
      imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&q=80',
      imageAlt: 'Crowd at a peaceful demonstration',
      imageCaption: 'Placeholder image — replace with rights-cleared photo for production',
    },
    {
      blockType: 'split_image_right',
      sortOrder: 4,
      heading: 'Students on the streets, governments on notice',
      bodyText:
        'From Soweto to the Velvet Revolution, student movements have exposed injustice and forced institutions to respond. The pattern repeats: moral authority, mass mobilization, and the demand for a seat at the table.',
      imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&q=80',
      imageAlt: 'Students collaborating outdoors',
      imageCaption: 'Placeholder image — replace with rights-cleared photo for production',
    },
    {
      blockType: 'quote_dark',
      sortOrder: 5,
      quoteText:
        'Young people are not only the leaders of tomorrow — they are leading today, in classrooms, online, and in the streets.',
      quoteSpeaker: 'United Nations',
      quoteSpeakerTitle: 'On youth participation and peace',
    },
    {
      blockType: 'full_image_overlay_center',
      sortOrder: 6,
      heading: 'Climate is a peace issue',
      bodyText:
        'Fridays for Future and allied movements linked environmental destruction to inequality and security. When millions of students walked out of class, they asked leaders to treat the planet — and each other — as if the future mattered.',
      imageUrl: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=1600&q=80',
      imageAlt: 'Landscape with wind turbines at dusk',
      imageCaption: 'Placeholder image — replace with rights-cleared photo for production',
    },
    {
      blockType: 'text_block',
      sortOrder: 7,
      heading: 'What comes next',
      bodyText:
        'The interactive timeline on this site traces more milestones: from regional uprisings to global solidarity. Use it as a starting point for teaching, advocacy, or your own organizing — and add the stories from your community that belong in this narrative.',
    },
  ],
  timeline: {
    title: 'Youth Have Always Moved History',
    description:
      'From lunch counters to climate strikes, young people have shaped the course of peace and justice worldwide.',
  },
  timelineEvents: [
    {
      sortOrder: 0,
      dateText: '1960',
      location: 'United States',
      heading: 'Sit-In Movement',
      description:
        'Four students sit at a segregated lunch counter, sparking a nationwide nonviolent movement that helps transform civil rights in America.',
    },
    {
      sortOrder: 1,
      dateText: '1976',
      location: 'South Africa',
      heading: 'Soweto Uprising',
      description:
        'Black school students protest apartheid education, igniting global outrage and intensifying the fight for freedom.',
    },
    {
      sortOrder: 2,
      dateText: '1989',
      location: 'Czechoslovakia',
      heading: 'Velvet Revolution',
      description:
        'Student demonstrations grow into a peaceful revolution that leads to democratic transition.',
    },
    {
      sortOrder: 3,
      dateText: '2010–2011',
      location: 'Tunisia',
      heading: 'Arab Spring',
      description:
        'Fueled by unemployment and exclusion, youth lead nationwide protests that ignite the Arab Spring and demand political change.',
    },
    {
      sortOrder: 4,
      dateText: '2012',
      location: 'India',
      heading: 'Delhi Anti-Rape Protests',
      description:
        'Following the brutal gang rape and murder of a young woman in Delhi, youth mobilize nationwide demanding justice and stronger protections for women, leading to major legal reforms.',
    },
    {
      sortOrder: 5,
      dateText: '2012',
      location: 'Pakistan',
      heading: 'The "Malala Moment"',
      description:
        "After Malala Yousafzai is shot for going to school, tens of thousands rally across Pakistan demanding girls' right to education and rejecting extremism.",
    },
    {
      sortOrder: 6,
      dateText: '2015',
      location: 'Argentina / Global',
      heading: 'Ni Una Menos (Not One Less)',
      description:
        'An intergenerational movement with youth at its heart reshapes laws and public discourse on gender-based violence.',
    },
    {
      sortOrder: 7,
      dateText: '2018–Present',
      location: 'Global',
      heading: 'Fridays for Future',
      description:
        'Millions of students in over 150 countries strike for climate action, linking environmental justice to peace and their right to a future.',
    },
  ],
};

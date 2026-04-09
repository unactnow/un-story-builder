/**
 * Seeded example: feature story aligned with photo-essay-template.html (UN photo essay blocks demo).
 * Timeline example matches youth-timeline.html (Youth Have Always Moved History — eight milestones, no images).
 */

module.exports = {
  featureStory: {
    title: 'Photo essay template',
  },
  storyBlocks: [
    {
      blockType: 'hero_video',
      sortOrder: 0,
      heading: 'Hero: Full-Screen Video with Centered Title',
      subheading:
        'Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      videoUrl: 'https://www.un.org/sites/un2.un.org/files/sample-video.mp4',
      imageCaption: 'Video credit goes here',
    },
    {
      blockType: 'text_block',
      sortOrder: 1,
      heading: 'Text Block: Header + Body',
      bodyText:
        'Cras mattis consectetur purus sit amet fermentum. Donec ullamcorper nulla non metus auctor fringilla. Aenean lacinia bibendum nulla sed consectetur.\n\nMaecenas sed diam eget risus varius blandit sit amet non magna. Donec id elit non mi porta gravida at eget metus.',
    },
    {
      blockType: 'full_image_overlay_left',
      sortOrder: 2,
      heading: 'Image + Text Overlay (Left)',
      bodyText:
        'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      imageUrl:
        'https://www.un.org/sites/un2.un.org/files/choosing-not-to-be-broken/1_Dialogues%20of%20Victory%20UA.jpg',
      imageAlt: 'Ukrainian youth participating in the Dialogues for Victory project',
      imageCaption: 'Photo credit lorem ipsum',
    },
    {
      blockType: 'split_image_left',
      sortOrder: 3,
      heading: 'Split: Image Left, Text Right',
      bodyText:
        'Nullam quis ante. Etiam sit amet orci eget eros faucibus tincidunt. Duis leo. Sed fringilla mauris sit amet nibh.\n\nDonec sodales sagittis magna. Sed consequat, leo eget bibendum sodales, augue velit cursus nunc.',
      imageUrl: 'https://www.un.org/sites/un2.un.org/files/major_swathi_shanthakumar_malakal_south_sudan.jpg',
      imageAlt: 'Major Swathi Shanthakumar, Indian peacekeeper in South Sudan',
      imageCaption: 'Credit: UN Photo',
    },
    {
      blockType: 'full_image_overlay_right',
      sortOrder: 4,
      heading: 'Image + Text Overlay (Right)',
      bodyText:
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
      imageUrl: 'https://www.un.org/sites/un2.un.org/files/major_swathi_shanthakumar_malakal_south_sudan.jpg',
      imageAlt: 'Major Swathi Shanthakumar, Indian peacekeeper in Malakal, South Sudan',
      imageCaption: 'Photo credit lorem ipsum',
    },
    {
      blockType: 'text_body',
      sortOrder: 5,
      bodyText:
        'Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.\n\nNullam id dolor id nibh ultricies vehicula ut id elit. Cras justo odio, dapibus ut facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.',
    },
    {
      blockType: 'quote_dark',
      sortOrder: 6,
      quoteText:
        'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.',
      quoteSpeaker: 'Speaker Name',
      quoteSpeakerTitle: 'Title, Organisation',
    },
    {
      blockType: 'split_image_right',
      sortOrder: 7,
      heading: 'Split: Image Right, Text Left',
      bodyText:
        'Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet etiam ultricies nisi vel augue.\n\nVestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.',
      imageUrl: 'https://www.un.org/sites/un2.un.org/files/2026/02/tanzania.jpg',
      imageAlt: 'UN peacekeepers from Tanzania on patrol',
      imageCaption: 'Credit: UN Photo',
    },
    {
      blockType: 'full_image',
      sortOrder: 8,
      imageUrl: 'https://www.un.org/sites/un2.un.org/files/women-empowerment.jpg',
      imageAlt: 'Women participating in an empowerment programme in Nepal',
      imageCaption: 'Photo credit lorem ipsum',
    },
    {
      blockType: 'text_block',
      sortOrder: 9,
      heading: 'Text Block: Another Header + Body',
      bodyText:
        'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.\n\nNeque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.',
    },
    {
      blockType: 'full_image_overlay_center',
      sortOrder: 10,
      heading: 'Image + Text Overlay (Center)',
      bodyText:
        'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      imageUrl: 'https://www.un.org/sites/un2.un.org/files/2025-12-05-my-peace/001.jpg',
      imageAlt:
        'Muhindo Kamate, trained by UNFPA with support from the Government of Japan, dedicates his life to supporting young people in DRC on the path to peace. Credit: RET Germany',
      imageCaption: 'Photo credit lorem ipsum',
    },
    {
      blockType: 'split_image_left',
      sortOrder: 11,
      heading: 'Split: Image Left (Again)',
      bodyText:
        'Nam pretium turpis et arcu. Duis arcu tortor, suscipit eget, imperdiet nec, imperdiet iaculis ipsum.\n\nPraesent porttitor, nulla vitae posuere iaculis, arcu nisl dignissim dolor, a pretium mi sem ut ipsum.',
      imageUrl: 'https://www.un.org/sites/un2.un.org/files/students-with-tablets.jpg',
      imageAlt: 'Students learning with tablets in rural Nepal',
      imageCaption: 'Credit: Heart of Nepal',
    },
    {
      blockType: 'quote_light',
      sortOrder: 12,
      quoteText:
        'Quote Block (Light): Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui.',
      quoteSpeaker: 'Speaker Name',
      quoteSpeakerTitle: 'Title, Organisation',
    },
    {
      blockType: 'full_image_subtitle',
      sortOrder: 13,
      subheading: 'Image + Statement Subtitle',
      imageUrl: 'https://www.un.org/sites/un2.un.org/files/women-empowerment.jpg',
      imageAlt: 'Women participating in an empowerment programme',
      imageCaption: 'Photo credit lorem ipsum',
    },
    {
      blockType: 'text_body',
      sortOrder: 14,
      bodyText:
        'Donec ullamcorper nulla non metus auctor fringilla. Maecenas sed diam eget risus varius blandit sit amet non magna. Integer posuere erat a ante venenatis dapibus posuere velit aliquet.\n\nAenean lacinia bibendum nulla sed consectetur. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus.',
    },
    {
      blockType: 'quote_dark',
      sortOrder: 15,
      quoteText:
        'Quote Block (Dark): Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae.',
      quoteSpeaker: 'Speaker Name',
      quoteSpeakerTitle: 'Title, Organisation',
    },
    {
      blockType: 'full_image',
      sortOrder: 16,
      imageUrl: 'https://www.un.org/sites/un2.un.org/files/a-movement-for-peace/DSC_0186.JPG',
      imageAlt: 'Peace Circle at the 80th UN General Assembly',
      imageCaption: 'Photo credit lorem ipsum',
    },
  ],
  timeline: {
    title: 'Youth Have Always Moved History',
    description:
      '<p>From lunch counters to climate strikes, young people have shaped the course of peace and justice worldwide.</p>',
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

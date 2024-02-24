// keystatic.config.ts
import { config, fields, collection } from '@keystatic/core';

const REPO_OWNER = 'pkellner';
const REPO_NAME = 'pkellner-keystatic';

export default config({
  storage: {
    kind: 'github',
    repo: `${REPO_OWNER}/${REPO_NAME}`
  },
  collections: {
    posts: collection({
      label: 'Posts',
      slugField: 'title',
      path: 'src/content/posts/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        content: fields.document({
          label: 'Content',
          formatting: true,
          dividers: true,
          links: true,
          images: true,
        }),
      },
    }),
  },
});
import { PrismaClient, PlatformRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Delete existing data (optional, for dev reset)
  await prisma.orgMembership.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.organisation.deleteMany();
  await prisma.user.deleteMany();

  const orgs = await Promise.all([
    prisma.organisation.create({
      data: {
        slug: 'org-alpha',
        name: 'Alpha Organisation',
        websiteUrl: 'https://alpha.org',
        logoUrl: null,
        feedUrl: null,
        isActive: true,
      },
    }),
    prisma.organisation.create({
      data: {
        slug: 'org-beta',
        name: 'Beta Organisation',
        websiteUrl: 'https://beta.org',
        logoUrl: null,
        feedUrl: null,
        isActive: true,
      },
    }),
    prisma.organisation.create({
      data: {
        slug: 'org-gamma',
        name: 'Gamma Organisation',
        websiteUrl: 'https://gamma.org',
        logoUrl: null,
        feedUrl: null,
        isActive: true,
      },
    }),
    prisma.organisation.create({
      data: {
        slug: 'org-delta',
        name: 'Delta Organisation',
        websiteUrl: 'https://delta.org',
        logoUrl: null,
        feedUrl: null,
        isActive: true,
      },
    }),
  ]);

  console.log('Seeded organisations:', orgs.map(o => o.slug));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


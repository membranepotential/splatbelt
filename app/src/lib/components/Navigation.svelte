<script lang="ts">
  import { page } from '$app/stores'

  type Link = {
    href: string
    label: string
  }

  const links: Link[] = [
    {
      href: '/projects',
      label: 'Projects',
    },
    {
      href: '/truck',
      label: 'Truck',
    },
    {
      href: '/other',
      label: 'other',
    },
  ]

  const classesActive = 'border-indigo-500 text-gray-900'
  const classesInactive =
    'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'

  const isActive = (l: Link, currentPathname: string) =>
    currentPathname.includes(l.href)
</script>

<nav class="border-b border-gray-200 bg-white">
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="flex h-16 justify-between">
      <div class="flex">
        <div class="flex flex-shrink-0 items-center">
          <a href="/">
            <img
              class="block h-8 w-auto lg:hidden"
              src="/mark.svg?color=indigo&shade=600"
              alt="Your Company"
            />
            <img
              class="hidden h-8 w-auto lg:block"
              src="/mark.svg?color=indigo&shade=600"
              alt="Your Company"
            />
          </a>
        </div>
        <div class="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
          {#each links as link}
            <a
              href={link.href}
              class="inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${isActive(
                link,
                $page.url.pathname
              )
                ? classesActive
                : classesInactive}">{link.label}</a
            >
          {/each}

          <!-- <a href="/inactivate" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium">Inactive</a> -->
        </div>
      </div>
      <div class="hidden sm:ml-6 sm:flex sm:items-center">
        <!-- Notifications -->
        <button
          type="button"
          class="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <span class="absolute -inset-1.5" />
          <span class="sr-only">View notifications</span>
          <span>🔔</span>
        </button>

        <!-- Profile dropdown -->
        <span>🤷🏻‍♀️</span>
      </div>
    </div>
  </div>
</nav>

<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & { children?: Snippet } = $props();
</script>

<div
	bind:this={ref}
	data-slot="button-group"
	role="group"
	class={cn(
		'flex w-fit items-center gap-0 [&>[data-slot=button]]:rounded-none [&>[data-slot=button]:first-child]:rounded-l-lg [&>[data-slot=button]:last-child]:rounded-r-lg [&>[data-slot=button]:focus-visible]:z-10',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>

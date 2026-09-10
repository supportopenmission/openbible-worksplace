<script lang="ts">
	import { Popover as PopoverPrimitive } from 'bits-ui';

	let { ...restProps }: PopoverPrimitive.RootProps = $props();
</script>

<PopoverPrimitive.Root data-slot="popover" {...restProps} />

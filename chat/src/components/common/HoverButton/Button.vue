<script setup lang="ts">
interface Emit {
	(e: 'click'): void;
}

const emit = defineEmits<Emit>();

function handleClick() {
	emit('click');
}
</script>

<template>
	<button
		class="flex items-center justify-center w-10 h-8 transition rounded-md hover:bg-neutral-100 dark:hover:bg-[#414755]"
		@click="handleClick"
	>
		<slot />
	</button>
</template>

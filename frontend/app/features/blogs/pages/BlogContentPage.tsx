interface BlogContentPageProps {
	blog: string; // Temporary foo string, will turn into blog
}

export function BlogContentPage(
	{ blog }: BlogContentPageProps
) {
	console.log(blog);
	return <div />;
}

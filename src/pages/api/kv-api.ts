import type { APIContext } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

export async function GET({ request }: APIContext): Promise<Response> {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return new Response(JSON.stringify({ error: "Key is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check if the KV binding is available (only in the Cloudflare environment)
  if (!env.blog) {
    return new Response(
      JSON.stringify({
        error:
          "KV namespace not available. Make sure you're running in Cloudflare environment.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const blog = env.blog;
  const value = await blog.get(key);

  return new Response(
    JSON.stringify({
      value: value,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

export async function POST({ request }: APIContext): Promise<Response> {
  // Check if the KV binding is available (only in the Cloudflare environment)
  if (!env.blog) {
    return new Response(
      JSON.stringify({
        error:
          "KV namespace not available. Make sure you're running in Cloudflare environment.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const blog = env.blog;

  try {
    const { key, value } = (await request.json()) as {
      key?: string;
      value?: string;
    };

    if (!key || !value) {
      return new Response(
        JSON.stringify({ error: "Both key and value are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    await blog.put(key, value);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}

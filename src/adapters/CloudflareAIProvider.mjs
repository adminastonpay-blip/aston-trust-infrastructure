/** Workers AI adapter. Construct only inside the isolated Model Runner service. */
export class CloudflareAIProvider {
  constructor(binding) {
    if (!binding || typeof binding.run !== "function") throw new TypeError("Workers AI binding unavailable");
    this.binding = binding;
  }
  run(model, inputs) {
    if (typeof model !== "string" || !model || !inputs || typeof inputs !== "object" || Array.isArray(inputs))
      throw new TypeError("Invalid model invocation");
    return this.binding.run(model, inputs);
  }
}

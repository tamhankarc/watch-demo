export class TheWatchApiClient {
  constructor(
    private readonly baseUrl =
      process.env.THEWATCHAPI_BASE_URL || "https://api.thewatchapi.com/v1",
    private readonly apiToken = process.env.THEWATCHAPI_API_KEY
  ) {}

  private buildUrl(path: string, params: Record<string, string> = {}) {
    if (!this.apiToken) {
      throw new Error("Missing THEWATCHAPI_TOKEN");
    }

    const searchParams = new URLSearchParams({
      ...params,
      api_token: this.apiToken
    });

    return `${this.baseUrl}${path}?${searchParams.toString()}`;
  }

  private async request(path: string, params: Record<string, string> = {}) {
    const url = this.buildUrl(path, params);

    const res = await fetch(url, {
      cache: "no-store"
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`thewatchapi request failed: ${res.status} ${body}`);
    }

    return res.json();
  }

  async listBrands() {
    return this.request("/brand/list");
  }

  async listModelsByBrand(brand: string) {
    return this.request("/model/list", { brand });
  }

  async listReferencesByBrand(brand: string) {
    return this.request("/reference/list", { brand });
  }

  async searchModelDetails(params: {
    brand?: string;
    model?: string;
    reference_number?: string;
  }) {
    return this.request("/model/search", params);
  }

  async searchModelByReference(referenceNumber: string) {
    return this.request("/model/search", {
      search: referenceNumber,
      search_attributes: "reference_number"
    });
  }
}
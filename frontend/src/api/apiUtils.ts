export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const unwrap = <T>(response: { data: ApiResponse<T> | T }): T => {
  const payload = response.data as ApiResponse<T>;
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return payload.data;
  }
  return response.data as T;
};

export const toNumberId = (id: string | number): number => {
  if (typeof id === 'number') return id;
  const match = id.match(/\d+$/);
  return Number(match ? match[0] : id);
};

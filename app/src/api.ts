import axios from 'axios';
import { CheckRequestBody } from '../../api/types';

export const BASE_URL = process.env.REACT_APP_API_ENDPOINT;

export async function checkRooms(rooms: string[], day: string, start: number, duration: number) {
  const payload: CheckRequestBody = {
    action: 'check',
    rooms,
    day,
    start,
    duration,
  };
  const response = await axios.post(`${BASE_URL}/rooms`, payload);
  if (response.data) {
    console.warn(response.data);
  }
}

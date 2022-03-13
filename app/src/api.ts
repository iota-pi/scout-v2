import axios from 'axios';
import { CheckRequestBody, OccupyRequestBody, ResponseBody } from '../../api/types';

export const BASE_URL = process.env.REACT_APP_API_ENDPOINT;

export async function checkRooms(
  rooms: string[],
  day: string,
  start: number,
  duration: number,
  week: number,
) {
  const payload: CheckRequestBody = {
    action: 'check',
    rooms,
    day,
    start,
    duration,
    week,
  };
  const response = await axios.post(`${BASE_URL}`, payload);
  if (response.data) {
    const data = response.data as ResponseBody;
    if (data.error) {
      console.error(data.error);
    }
    return data.results;
  }
  throw new Error('No response received');
}

export async function occupyRoom(
  rooms: string[],
  day: string,
  start: number,
  duration: number,
  week: number,
  occupied: boolean,
) {
  const payload: OccupyRequestBody = {
    action: 'occupy',
    rooms,
    day,
    start,
    duration,
    occupied,
    week,
  };
  const response = await axios.post(`${BASE_URL}`, payload);
  if (response.data) {
    const data = response.data as ResponseBody;
    if (data.error) {
      console.error(data.error);
    }
    return data.results;
  }
  throw new Error('No response received');
}

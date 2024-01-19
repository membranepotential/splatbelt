import { Entity, type EntityItem, type UpdateEntityItem } from 'electrodb'
import { Dynamo } from '$lib/server/dynamo'
import { AnalysisState } from '$lib/schemas'
import { Movement } from '$lib/types'

export const ProjectEntity = new Entity(
  {
    model: {
      service: 'splatbelt',
      entity: 'project',
      version: '1',
    },
    attributes: {
      id: {
        type: 'string',
        required: true,
        readOnly: true,
      },
      name: { type: 'string', required: true },
      created: {
        type: 'string',
        default: () => new Date().toISOString(),
        required: true,
        readOnly: true,
      },
      state: {
        type: Object.values(AnalysisState),
        default: AnalysisState.CONFIGURING,
        required: true,
      },
      camera: {
        type: 'map',
        properties: {
          position: { type: 'list', items: { type: 'number' }, required: true },
          up: {
            type: 'list',
            items: { type: 'number' },
            default: [0, 1, 0],
            required: true,
          },
          center: {
            type: 'list',
            items: { type: 'number' },
            default: [0, 0, 0],
            required: true,
          },
          fov: { type: 'number', default: 50, required: true },
        },
        readOnly: true,
      },
      shots: {
        type: 'list',
        items: {
          type: 'map',
          properties: {
            motion: {
              type: 'map',
              properties: {
                x: { type: Object.values(Movement), required: true },
                y: { type: Object.values(Movement), required: true },
              },
              required: true,
            },
            speed: { type: 'number', default: 1, required: true },
            samples: {
              type: 'list',
              items: {
                type: 'map',
                properties: {
                  timeStamp: { type: 'number', required: true },
                  pointer: {
                    type: 'map',
                    properties: {
                      x: { type: 'number', required: true },
                      y: { type: 'number', required: true },
                    },
                    required: true,
                  },
                  camera: {
                    type: 'map',
                    properties: {
                      position: {
                        type: 'map',
                        properties: {
                          x: { type: 'number', required: true },
                          y: { type: 'number', required: true },
                          z: { type: 'number', required: true },
                        },
                        required: true,
                      },
                      target: {
                        type: 'map',
                        properties: {
                          x: { type: 'number', required: true },
                          y: { type: 'number', required: true },
                          z: { type: 'number', required: true },
                        },
                        required: true,
                      },
                      zoom: { type: 'number', required: true },
                    },
                    required: true,
                  },
                },
              },
              required: true,
            },
          },
        },
        default: [],
        required: true,
      },
    },
    indexes: {
      primary: {
        pk: {
          field: 'pk',
          composite: [],
        },
        sk: {
          field: 'sk',
          composite: ['id'],
        },
      },
    },
  },
  Dynamo.Configuration
)

export type ProjectItem = EntityItem<typeof ProjectEntity>
export type ShotItem = ProjectItem['shots'][0]

export type UpdateProjectItem = UpdateEntityItem<typeof ProjectEntity>

export async function create(id: string, name: string) {
  const result = await ProjectEntity.create({ id, name }).go()
  return result.data
}

export async function list() {
  const result = await ProjectEntity.query.primary({}).go()
  return result.data
}

export async function get(id: string) {
  const result = await ProjectEntity.get({ id }).go()
  return result.data
}

export function update(id: string, data: UpdateProjectItem) {
  return ProjectEntity.patch({ id }).set(data).go()
}

export function delete_(id: string) {
  return ProjectEntity.delete({ id }).go()
}

import * as Router from 'koa-router'
import {getRepository} from 'typeorm'
import {Project} from '../entity/Project'
import {User} from '../entity/User'
import {placementRouter} from './placement'

const authenticatedProjectRouter = new Router()
    .use((ctx, next) => {
        if (!ctx.isAuthenticated()) {
            return ctx.throw(401)
        }
        return next()
    })
    .post('/', ctx => {
        const {header, text} = ctx.request.body
        const user = ctx.session as any as User
        const project = new Project()
        project.header = header
        project.text = text
        project.creator = user

        return getRepository(Project)
            .save(project)
    })
    .put('/:projectId', async ctx => {
        const {header, text}: {
            header?: string,
            text?: string,
        } = ctx.request.body

        const user = ctx.session as any as User
        const projectRepository = getRepository(Project)
        const project = await projectRepository
            .findOneById(ctx.params.projectId)

        if (!project) {
            return ctx.throw(404)
        }

        if (user.username !== project.creator.username) {
            return ctx.throw(403, 'not creator of project')
        }
        project.header = header === undefined ? project.header : header
        project.text = text === undefined ? project.text : text

        await projectRepository.save(project)
    })
    .delete('/:projectId', async ctx => {
        const user = ctx.session as any as User
        const projectsRepository = getRepository(Project)
        const project = await projectsRepository
            .findOneById(ctx.params.projectId)

        if (!project) {
            return ctx.throw(404)
        }

        if (user.username !== project.creator.username) {
            return ctx.throw(403, 'not creator of project')
        }

        await projectsRepository.deleteById(project.id)
    })
    .use('/:projectId', placementRouter.routes(), placementRouter.allowedMethods())

export const projectRouter = new Router()
    .prefix('/project')
    .get('/', async ctx => {
        const {from = 0, limit = 10} = ctx.request.query

        ctx.body = await getRepository(Project)
            .find({take: limit, skip: from})
    })
    .get('/:id', async ctx => {
        const id = ctx.params.id

        const projectRepository = getRepository(Project)

        let project = await projectRepository.findOneById(id)

        if (!project) {
            return ctx.throw(404)
        }

        if (ctx.session && project.creatorId === ctx.session.username) {
            // if project creator - add participation requests
            project = await projectRepository.findOneById(id, {
                relations: ['placements', 'placements.participationRequests']
            })
        }
        ctx.body = project
    })
    .use(authenticatedProjectRouter.routes(), authenticatedProjectRouter.allowedMethods())

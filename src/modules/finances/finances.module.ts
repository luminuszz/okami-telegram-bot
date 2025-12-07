import { FinancesController } from "@modules/finances/finances.controller";
import { FinancesService } from "@modules/finances/finances.service";
import { IaModule } from "@modules/ia/ia.module";
import { Module } from "@nestjs/common";

@Module({
	imports: [IaModule],
	providers: [FinancesService],
	controllers: [FinancesController],
})
export class FinancesModule {}

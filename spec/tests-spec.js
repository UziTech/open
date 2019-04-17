/** @babel */

import url from "url";
import qs from "querystring";
import open from "../";

describe("Open", function () {
	beforeEach(async function () {
		spyOn(atom, "open");
		spyOn(atom, "confirm");
		this.confirmReturn = (bool) => atom.confirm.and.callFake((options, callback) => callback(bool));
		this.confirmReturn(true);
		this.testUrl = ({
			file = "test/file.ext",
			line = 0,
			column = 0,
			devMode = false,
			safeMode = false,
			newWindow = false
		} = {}) => {
			const query = {
				url: `file://${file}`,
			};
			if (line) {
				query.line = line;
			}
			if (column) {
				query.column = column;
			}
			if (devMode) {
				query.devMode = devMode;
			}
			if (safeMode) {
				query.safeMode = safeMode;
			}
			if (newWindow) {
				query.newWindow = newWindow;
			}
			return url.parse(`atom://open/?${qs.stringify(query)}`, true);
		};
	});

	it("should call open on uri", async function () {
		// atom.packages.loadPackage("open").activateNow();
		spyOn(open, "handleURI");
		const activationPromise = atom.packages.activatePackage("open");
		atom.uriHandlerRegistry.handleURI("atom://open");
		await activationPromise;

		expect(open.handleURI).toHaveBeenCalled();
	});

	describe("handleURI", function () {
		beforeEach(function () {
			atom.packages.loadPackage("open").activateNow();
		});

		it("should call atom.open on confirm", async function () {
			await open.handleURI(this.testUrl());

			expect(atom.confirm).toHaveBeenCalled();
			expect(atom.open).toHaveBeenCalledWith(jasmine.objectContaining({
				pathsToOpen: ["test/file.ext"],
			}));
		});

		it("should not confirm", async function () {
			atom.config.set("open.confirmBeforeOpen", false);
			await open.handleURI(this.testUrl());

			expect(atom.confirm).not.toHaveBeenCalled();
			expect(atom.open).toHaveBeenCalled();
		});

		it("should cancel on no confirm", async function () {
			this.confirmReturn(false);
			await open.handleURI(this.testUrl());

			expect(atom.confirm).toHaveBeenCalled();
			expect(atom.open).not.toHaveBeenCalled();
		});

		it("should open project folder", async function () {
			atom.config.set("open.openProject", true);
			spyOn(atom.history, "getProjects").and.returnValue([{paths: ["test/"]}]);
			await open.handleURI(this.testUrl());

			expect(atom.open).toHaveBeenCalledWith(jasmine.objectContaining({
				pathsToOpen: ["test/file.ext", "test/"],
			}));
		});

		it("should pass params to atom.open", async function () {
			await open.handleURI(this.testUrl({
				file: "/path/test.js",
				line: 1,
				column: 2,
				devMode: true,
				safeMode: true,
				newWindow: true,
			}));

			expect(atom.open).toHaveBeenCalledWith(jasmine.objectContaining({
				pathsToOpen: ["/path/test.js:1:2"],
				devMode: true,
				safeMode: true,
				newWindow: true,
			}));
		});
	});
});
